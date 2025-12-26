'use server';

import { prisma } from '@/lib/db';
import type { Payment, PaymentStatus, PaymentMethod } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { getCurrentUser } from './auth';
import { sendEmail } from '@/lib/email';
import {
	createBookingConfirmationEmail,
	createSubscriptionConfirmationEmail,
} from '@/lib/email-templates';

// ============================================
// TYPES
// ============================================

export interface PaymentWithRelations extends Payment {
	user: {
		id: string;
		name: string;
		email: string;
	};
	booking?: {
		id: string;
		bookingNumber: string;
		space: {
			name: string;
		};
	} | null;
	membership?: {
		id: string;
		membershipNumber: string;
		space: {
			name: string;
		};
	} | null;
}

export interface PaymentResult {
	success: boolean;
	message: string;
	data?: PaymentWithRelations | PaymentWithRelations[];
	error?: string;
}

export interface InitializePaymentInput {
	bookingId?: string;
	membershipId?: string;
	amount: number;
	method?: PaymentMethod;
	callbackUrl?: string;
}

export interface PaystackInitResponse {
	authorization_url: string;
	access_code: string;
	reference: string;
}

export interface PaystackVerifyResponse {
	status: string;
	reference: string;
	amount: number;
	paid_at: string;
	channel: string;
	currency: string;
	metadata: Record<string, unknown>;
}

// ============================================
// HELPERS
// ============================================

function generateReference(): string {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = randomBytes(4).toString('hex').toUpperCase();
	return `AMG-PAY-${timestamp}${random}`;
}

// ============================================
// READ ACTIONS
// ============================================

export async function getPayments(options?: {
	userId?: string;
	status?: PaymentStatus;
	method?: PaymentMethod;
	fromDate?: Date;
	toDate?: Date;
	limit?: number;
	offset?: number;
}): Promise<PaymentResult> {
	try {
		const {
			userId,
			status,
			method,
			fromDate,
			toDate,
			limit = 50,
			offset = 0,
		} = options || {};

		const payments = await prisma.payment.findMany({
			where: {
				...(userId && { userId }),
				...(status && { status }),
				...(method && { method }),
				...(fromDate && { createdAt: { gte: fromDate } }),
				...(toDate && { createdAt: { lte: toDate } }),
			},
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
				booking: {
					select: {
						id: true,
						bookingNumber: true,
						space: { select: { name: true } },
					},
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: { select: { name: true } },
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
			skip: offset,
		});

		return {
			success: true,
			message: 'Payments fetched successfully',
			data: payments as PaymentWithRelations[],
		};
	} catch (error) {
		console.error('Get payments error:', error);
		return {
			success: false,
			message: 'Failed to fetch payments',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getPaymentById(id: string): Promise<PaymentResult> {
	try {
		const payment = await prisma.payment.findUnique({
			where: { id },
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
				booking: {
					select: {
						id: true,
						bookingNumber: true,
						space: { select: { name: true } },
					},
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: { select: { name: true } },
					},
				},
			},
		});

		if (!payment) {
			return {
				success: false,
				message: 'Payment not found',
			};
		}

		return {
			success: true,
			message: 'Payment fetched successfully',
			data: payment as PaymentWithRelations,
		};
	} catch (error) {
		console.error('Get payment by id error:', error);
		return {
			success: false,
			message: 'Failed to fetch payment',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getPaymentByReference(
	reference: string
): Promise<PaymentResult> {
	try {
		const payment = await prisma.payment.findUnique({
			where: { reference },
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
				booking: {
					select: {
						id: true,
						bookingNumber: true,
						space: { select: { name: true } },
					},
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: { select: { name: true } },
					},
				},
			},
		});

		if (!payment) {
			return {
				success: false,
				message: 'Payment not found',
			};
		}

		return {
			success: true,
			message: 'Payment fetched successfully',
			data: payment as PaymentWithRelations,
		};
	} catch (error) {
		console.error('Get payment by reference error:', error);
		return {
			success: false,
			message: 'Failed to fetch payment',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getUserPayments(): Promise<PaymentResult> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to view your payments',
			};
		}

		return getPayments({ userId: user.id });
	} catch (error) {
		console.error('Get user payments error:', error);
		return {
			success: false,
			message: 'Failed to fetch payments',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// INITIALIZE PAYMENT
// ============================================

export async function initializePayment(
	input: InitializePaymentInput
): Promise<{
	success: boolean;
	message: string;
	data?: {
		paymentId: string;
		reference: string;
		authorizationUrl?: string;
	};
	error?: string;
}> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to make a payment',
			};
		}

		// Validate that either bookingId or membershipId is provided
		if (!input.bookingId && !input.membershipId) {
			return {
				success: false,
				message: 'Either booking or membership ID is required',
			};
		}

		const reference = generateReference();

		// Create payment record
		const payment = await prisma.payment.create({
			data: {
				reference,
				userId: user.id,
				bookingId: input.bookingId || null,
				membershipId: input.membershipId || null,
				amount: input.amount,
				method: input.method || 'CARD',
				status: 'PENDING',
			},
		});

		// In production, you would integrate with Paystack here
		// For now, we'll return the payment details for the frontend to handle

		const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

		if (paystackSecretKey) {
			// Initialize Paystack transaction
			const paystackResponse = await fetch(
				'https://api.paystack.co/transaction/initialize',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${paystackSecretKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						email: user.email,
						amount: input.amount, // Amount is already in kobo
						reference,
						callback_url:
							input.callbackUrl ||
							`${process.env.NEXT_PUBLIC_APP_URL}/booking/confirmation`,
						metadata: {
							payment_id: payment.id,
							booking_id: input.bookingId,
							membership_id: input.membershipId,
							user_id: user.id,
						},
					}),
				}
			);

			const paystackData = await paystackResponse.json();

			if (paystackData.status) {
				// Update payment with Paystack access code
				await prisma.payment.update({
					where: { id: payment.id },
					data: {
						gatewayResponse: paystackData.data,
					},
				});

				return {
					success: true,
					message: 'Payment initialized',
					data: {
						paymentId: payment.id,
						reference,
						authorizationUrl: paystackData.data.authorization_url,
					},
				};
			}
		}

		// Fallback for development without Paystack
		return {
			success: true,
			message: 'Payment initialized',
			data: {
				paymentId: payment.id,
				reference,
			},
		};
	} catch (error) {
		console.error('Initialize payment error:', error);
		return {
			success: false,
			message: 'Failed to initialize payment',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// VERIFY PAYMENT
// ============================================

export async function verifyPayment(reference: string): Promise<PaymentResult> {
	try {
		// Decode URL-encoded reference if needed
		const decodedReference = decodeURIComponent(reference);

		console.log('Verifying payment with reference:', decodedReference);

		const payment = await prisma.payment.findUnique({
			where: { reference: decodedReference },
			include: {
				booking: true,
				membership: true,
			},
		});

		if (!payment) {
			console.log('Payment not found for reference:', decodedReference);
			// Try to find by partial match in case of encoding issues
			const possiblePayment = await prisma.payment.findFirst({
				where: {
					reference: {
						contains: decodedReference.replace('AMG-PAY-', ''),
					},
				},
				include: {
					booking: true,
					membership: true,
				},
			});

			if (possiblePayment) {
				console.log(
					'Found payment with partial match:',
					possiblePayment.reference
				);
			}

			return {
				success: false,
				message: 'Payment not found',
			};
		}

		// If already verified, return success
		if (payment.status === 'PAID') {
			const fullPayment = await prisma.payment.findUnique({
				where: { reference },
				include: {
					user: {
						select: { id: true, name: true, email: true },
					},
					booking: {
						select: {
							id: true,
							bookingNumber: true,
							space: { select: { name: true } },
						},
					},
					membership: {
						select: {
							id: true,
							membershipNumber: true,
							space: { select: { name: true } },
						},
					},
				},
			});

			return {
				success: true,
				message: 'Payment already verified',
				data: fullPayment as PaymentWithRelations,
			};
		}

		const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

		if (paystackSecretKey) {
			// Verify with Paystack
			const verifyResponse = await fetch(
				`https://api.paystack.co/transaction/verify/${reference}`,
				{
					headers: {
						Authorization: `Bearer ${paystackSecretKey}`,
					},
				}
			);

			const verifyData = await verifyResponse.json();

			if (verifyData.status && verifyData.data.status === 'success') {
				return processSuccessfulPayment(payment.id, verifyData.data);
			} else {
				// Payment failed
				await prisma.payment.update({
					where: { id: payment.id },
					data: {
						status: 'FAILED',
						gatewayResponse: verifyData.data,
					},
				});

				return {
					success: false,
					message: 'Payment verification failed',
				};
			}
		}

		// Development fallback - auto-succeed
		return processSuccessfulPayment(payment.id, { channel: 'test' });
	} catch (error) {
		console.error('Verify payment error:', error);
		return {
			success: false,
			message: 'Failed to verify payment',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// PROCESS SUCCESSFUL PAYMENT
// ============================================

async function processSuccessfulPayment(
	paymentId: string,
	gatewayResponse: Record<string, unknown>
): Promise<PaymentResult> {
	try {
		const payment = await prisma.payment.update({
			where: { id: paymentId },
			data: {
				status: 'PAID',
				paidAt: new Date(),
				gatewayResponse: gatewayResponse as object,
			},
			include: {
				booking: true,
				membership: true,
			},
		});

		// Update associated booking or membership
		if (payment.bookingId) {
			await prisma.booking.update({
				where: { id: payment.bookingId },
				data: {
					paymentStatus: 'PAID',
					status: 'CONFIRMED',
				},
			});
		}

		if (payment.membershipId) {
			await prisma.membership.update({
				where: { id: payment.membershipId },
				data: {
					paymentStatus: 'PAID',
					status: 'ACTIVE',
				},
			});

			// Send subscription confirmation email
			const membership = await prisma.membership.findUnique({
				where: { id: payment.membershipId },
				include: {
					user: { select: { name: true, email: true } },
					space: { select: { name: true } },
					pricingPlan: { select: { name: true } },
				},
			});

			if (membership) {
				const confirmEmail =
					createSubscriptionConfirmationEmail(membership);
				await sendEmail({
					to: membership.user.email,
					subject: confirmEmail.subject,
					html: confirmEmail.html,
				});
			}
		}

		// Fetch full payment with relations
		const fullPayment = await prisma.payment.findUnique({
			where: { id: paymentId },
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
				booking: {
					select: {
						id: true,
						bookingNumber: true,
						space: { select: { name: true } },
					},
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: { select: { name: true } },
					},
				},
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/bookings');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/bookings');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Payment successful!',
			data: fullPayment as PaymentWithRelations,
		};
	} catch (error) {
		console.error('Process successful payment error:', error);
		return {
			success: false,
			message: 'Failed to process payment',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// MANUAL PAYMENT (Admin)
// ============================================

export async function recordManualPayment(input: {
	bookingId?: string;
	membershipId?: string;
	amount: number;
	method: PaymentMethod;
	notes?: string;
}): Promise<PaymentResult> {
	try {
		// Verify admin permission
		const user = await getCurrentUser();

		if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		// Get booking or membership to find user
		let userId: string | undefined;

		if (input.bookingId) {
			const booking = await prisma.booking.findUnique({
				where: { id: input.bookingId },
				select: { userId: true },
			});
			userId = booking?.userId;
		} else if (input.membershipId) {
			const membership = await prisma.membership.findUnique({
				where: { id: input.membershipId },
				select: { userId: true },
			});
			userId = membership?.userId;
		}

		if (!userId) {
			return {
				success: false,
				message: 'Could not determine user for payment',
			};
		}

		const reference = generateReference();

		const payment = await prisma.payment.create({
			data: {
				reference,
				userId,
				bookingId: input.bookingId || null,
				membershipId: input.membershipId || null,
				amount: input.amount,
				method: input.method,
				status: 'PAID',
				paidAt: new Date(),
				gatewayResponse: {
					manual: true,
					recordedBy: user.id,
					notes: input.notes,
				},
			},
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
				booking: {
					select: {
						id: true,
						bookingNumber: true,
						space: { select: { name: true } },
					},
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: { select: { name: true } },
					},
				},
			},
		});

		// Update associated booking or membership
		if (input.bookingId) {
			await prisma.booking.update({
				where: { id: input.bookingId },
				data: {
					paymentStatus: 'PAID',
					status: 'CONFIRMED',
				},
			});

			// Send booking confirmation email
			const booking = await prisma.booking.findUnique({
				where: { id: payment.bookingId },
				include: {
					user: { select: { name: true, email: true } },
					space: { select: { name: true } },
					pricingPlan: { select: { name: true } },
				},
			});

			if (booking) {
				const confirmEmail = createBookingConfirmationEmail(booking);
				await sendEmail({
					to: booking.user.email,
					subject: confirmEmail.subject,
					html: confirmEmail.html,
				});
			}
		}

		if (payment.membershipId) {
			await prisma.membership.update({
				where: { id: payment.membershipId },
				data: {
					paymentStatus: 'PAID',
					status: 'ACTIVE',
				},
			});

			// Send subscription confirmation email
			const membership = await prisma.membership.findUnique({
				where: { id: payment.membershipId },
				include: {
					user: { select: { name: true, email: true } },
					space: { select: { name: true } },
					pricingPlan: { select: { name: true } },
				},
			});

			if (membership) {
				const confirmEmail =
					createSubscriptionConfirmationEmail(membership);
				await sendEmail({
					to: membership.user.email,
					subject: confirmEmail.subject,
					html: confirmEmail.html,
				});
			}
		}

		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'payment.manual_recorded',
				entityType: 'Payment',
				entityId: payment.id,
				metadata: {
					reference,
					amount: input.amount,
					method: input.method,
				},
			},
		});

		revalidatePath('/admin/bookings');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Payment recorded successfully',
			data: payment as PaymentWithRelations,
		};
	} catch (error) {
		console.error('Record manual payment error:', error);
		return {
			success: false,
			message: 'Failed to record payment',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// REFUND
// ============================================

export async function refundPayment(
	id: string,
	reason?: string
): Promise<PaymentResult> {
	try {
		const user = await getCurrentUser();

		if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const payment = await prisma.payment.findUnique({ where: { id } });

		if (!payment) {
			return {
				success: false,
				message: 'Payment not found',
			};
		}

		if (payment.status !== 'PAID') {
			return {
				success: false,
				message: 'Only successful payments can be refunded',
			};
		}

		// In production, initiate refund with payment gateway
		const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

		if (paystackSecretKey && payment.gatewayResponse) {
			// Initiate Paystack refund
			const refundResponse = await fetch(
				'https://api.paystack.co/refund',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${paystackSecretKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						transaction: payment.reference,
					}),
				}
			);

			const refundData = await refundResponse.json();

			if (!refundData.status) {
				return {
					success: false,
					message: 'Refund failed: ' + refundData.message,
				};
			}
		}

		const updatedPayment = await prisma.payment.update({
			where: { id },
			data: {
				status: 'REFUNDED',
				refundedAt: new Date(),
				refundReason: reason,
			},
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
				booking: {
					select: {
						id: true,
						bookingNumber: true,
						space: { select: { name: true } },
					},
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: { select: { name: true } },
					},
				},
			},
		});

		// Update associated booking or membership
		if (payment.bookingId) {
			await prisma.booking.update({
				where: { id: payment.bookingId },
				data: {
					paymentStatus: 'REFUNDED',
					status: 'CANCELLED',
				},
			});
		}

		if (payment.membershipId) {
			await prisma.membership.update({
				where: { id: payment.membershipId },
				data: {
					paymentStatus: 'REFUNDED',
					status: 'CANCELLED',
				},
			});
		}

		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'payment.refunded',
				entityType: 'Payment',
				entityId: id,
				metadata: {
					reference: payment.reference,
					reason,
				},
			},
		});

		revalidatePath('/admin/bookings');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Payment refunded successfully',
			data: updatedPayment as PaymentWithRelations,
		};
	} catch (error) {
		console.error('Refund payment error:', error);
		return {
			success: false,
			message: 'Failed to refund payment',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// PAYMENT STATS (Admin)
// ============================================

export async function getPaymentStats(options?: {
	fromDate?: Date;
	toDate?: Date;
}): Promise<{
	success: boolean;
	data?: {
		totalRevenue: number;
		totalTransactions: number;
		successfulPayments: number;
		pendingPayments: number;
		failedPayments: number;
		refundedAmount: number;
		revenueByMethod: Record<string, number>;
	};
	error?: string;
}> {
	try {
		const { fromDate, toDate } = options || {};

		const dateFilter = {
			...(fromDate && { createdAt: { gte: fromDate } }),
			...(toDate && { createdAt: { lte: toDate } }),
		};

		const [
			totalStats,
			successfulPayments,
			pendingPayments,
			failedPayments,
			refundedPayments,
		] = await Promise.all([
			prisma.payment.aggregate({
				where: { status: 'PAID', ...dateFilter },
				_sum: { amount: true },
				_count: true,
			}),
			prisma.payment.count({
				where: { status: 'PAID', ...dateFilter },
			}),
			prisma.payment.count({
				where: { status: 'PENDING', ...dateFilter },
			}),
			prisma.payment.count({
				where: { status: 'FAILED', ...dateFilter },
			}),
			prisma.payment.aggregate({
				where: { status: 'REFUNDED', ...dateFilter },
				_sum: { amount: true },
			}),
		]);

		// Revenue by payment method
		const paymentsByMethod = await prisma.payment.groupBy({
			by: ['method'],
			where: { status: 'PAID', ...dateFilter },
			_sum: { amount: true },
		});

		const revenueByMethod: Record<string, number> = {};
		paymentsByMethod.forEach(
			(p: { method: string; _sum: { amount: number | null } }) => {
				revenueByMethod[p.method] = p._sum?.amount || 0;
			}
		);

		return {
			success: true,
			data: {
				totalRevenue: totalStats._sum?.amount || 0,
				totalTransactions: successfulPayments,
				successfulPayments,
				pendingPayments,
				failedPayments,
				refundedAmount: refundedPayments._sum?.amount || 0,
				revenueByMethod,
			},
		};
	} catch (error) {
		console.error('Get payment stats error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

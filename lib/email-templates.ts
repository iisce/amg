import { createEmailTemplate } from './email';
import type { Booking, Membership, Payment } from '@prisma/client';
import { format } from 'date-fns';

// ============================================
// AUTHENTICATION EMAILS
// ============================================

export function createWelcomeEmail(user: { name: string; email: string }): {
	subject: string;
	html: string;
} {
	const content = `
		<h2>Welcome to AMG Workspace! 🎉</h2>
		<p>Hi ${user.name},</p>
		<p>Thank you for joining AMG Workspace! We're excited to have you as part of our community.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Your account is now active!</strong></p>
			<p style="margin: 10px 0 0 0;">Email: ${user.email}</p>
		</div>

		<p>With your account, you can:</p>
		<ul>
			<li>Browse and book our coworking spaces</li>
			<li>Manage your bookings and subscriptions</li>
			<li>Access exclusive member benefits</li>
			<li>View your booking history and invoices</li>
		</ul>

		<a href="${process.env.NEXT_PUBLIC_APP_URL}/spaces" class="button">Explore Spaces</a>

		<p>If you have any questions, feel free to reach out to our support team.</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: 'Welcome to AMG Workspace!',
		html: createEmailTemplate(content),
	};
}

export function createPasswordResetEmail(
	user: { name: string; email: string },
	resetToken: string
): {
	subject: string;
	html: string;
} {
	const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

	const content = `
		<h2>Password Reset Request</h2>
		<p>Hi ${user.name},</p>
		<p>We received a request to reset your password for your AMG Workspace account.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>⚠️ Important:</strong> This link will expire in 1 hour.</p>
		</div>

		<p>Click the button below to reset your password:</p>
		<a href="${resetLink}" class="button">Reset Password</a>

		<p>Or copy and paste this link into your browser:</p>
		<p style="word-break: break-all; color: #FDB913;">${resetLink}</p>

		<div class="divider"></div>

		<p><strong>Didn't request this?</strong></p>
		<p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: 'Reset Your Password - AMG Workspace',
		html: createEmailTemplate(content),
	};
}

export function createPasswordResetSuccessEmail(user: {
	name: string;
	email: string;
}): {
	subject: string;
	html: string;
} {
	const content = `
		<h2>Password Changed Successfully ✅</h2>
		<p>Hi ${user.name},</p>
		<p>Your password has been successfully changed for your AMG Workspace account.</p>

		<div class="info-box">
			<p style="margin: 0;">Email: ${user.email}</p>
			<p style="margin: 10px 0 0 0;">Changed: ${format(new Date(), 'PPpp')}</p>
		</div>

		<p>You can now log in with your new password.</p>
		<a href="${
			process.env.NEXT_PUBLIC_APP_URL
		}/login" class="button">Login to Your Account</a>

		<div class="divider"></div>

		<p><strong>⚠️ Security Alert</strong></p>
		<p>If you didn't make this change, please contact our support team immediately.</p>

		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: 'Password Changed - AMG Workspace',
		html: createEmailTemplate(content),
	};
}

// ============================================
// BOOKING EMAILS
// ============================================

export function createBookingConfirmationEmail(
	booking: Booking & {
		user: { name: string; email: string };
		space: { name: string };
		pricingPlan: { name: string };
	},
	qrCodeUrl?: string
): {
	subject: string;
	html: string;
} {
	const formattedTotal = `₦${(booking.totalAmount / 100).toLocaleString()}`;
	const bookingDate = format(
		new Date(booking.bookingDate),
		'EEEE, MMMM d, yyyy'
	);
	const startTime = format(new Date(booking.startTime), 'h:mm a');
	const endTime = format(new Date(booking.endTime), 'h:mm a');

	const content = `
		<h2>Booking Confirmed! 🎉</h2>
		<p>Hi ${booking.user.name},</p>
		<p>Your booking has been confirmed and payment received. We look forward to seeing you!</p>

		<div class="info-box">
			<p style="margin: 0; font-size: 18px;"><strong>Booking ID: ${
				booking.bookingNumber
			}</strong></p>
		</div>

		<h3 style="margin-top: 30px;">Booking Details</h3>
		<div class="detail-row">
			<span class="detail-label">Space:</span>
			<span class="detail-value">${booking.space.name}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Date:</span>
			<span class="detail-value">${bookingDate}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Time:</span>
			<span class="detail-value">${startTime} - ${endTime}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Plan:</span>
			<span class="detail-value">${booking.pricingPlan.name}</span>
		</div>
		${
			booking.attendees
				? `
		<div class="detail-row">
			<span class="detail-label">Attendees:</span>
			<span class="detail-value">${booking.attendees}</span>
		</div>
		`
				: ''
		}

		<div class="divider"></div>

		<h3>Payment Summary</h3>
		<div class="detail-row" style="border-top: 2px solid #FDB913; padding-top: 10px; margin-top: 10px;">
			<span class="detail-label" style="font-size: 18px;"><strong>Total Paid:</strong></span>
			<span class="detail-value" style="font-size: 18px; color: #2B2B2B;"><strong>${formattedTotal}</strong></span>
		</div>

		${
			qrCodeUrl
				? `
		<div class="divider"></div>
		<h3>Your QR Code</h3>
		<p>Present this QR code at check-in:</p>
		<div style="text-align: center; margin: 20px 0;">
			<img src="${qrCodeUrl}" alt="Booking QR Code" style="max-width: 200px; border: 2px solid #FDB913; border-radius: 8px; padding: 10px;" />
		</div>
		`
				: ''
		}

		<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${
		booking.id
	}" class="button">View Booking Details</a>

		<div class="info-box" style="margin-top: 30px;">
			<p style="margin: 0;"><strong>📍 What to bring:</strong></p>
			<ul style="margin: 10px 0 0 0; padding-left: 20px;">
				<li>This confirmation email or QR code</li>
				<li>Valid ID</li>
				<li>Any equipment you need</li>
			</ul>
		</div>

		<p style="margin-top: 30px;">See you soon!</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Booking Confirmed - ${booking.space.name} (${booking.bookingNumber})`,
		html: createEmailTemplate(content),
	};
}

export function createBookingCancellationEmail(
	booking: Booking & {
		user: { name: string; email: string };
		space: { name: string };
	}
): {
	subject: string;
	html: string;
} {
	const bookingDate = format(
		new Date(booking.bookingDate),
		'EEEE, MMMM d, yyyy'
	);
	const startTime = format(new Date(booking.startTime), 'h:mm a');

	const content = `
		<h2>Booking Cancelled</h2>
		<p>Hi ${booking.user.name},</p>
		<p>Your booking has been cancelled as requested.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Booking ID: ${booking.bookingNumber}</strong></p>
			<p style="margin: 10px 0 0 0;">Space: ${booking.space.name}</p>
			<p style="margin: 5px 0 0 0;">Date: ${bookingDate} at ${startTime}</p>
		</div>

		${
			booking.paymentStatus === 'PAID'
				? `
		<p>If you paid for this booking, a refund will be processed within 5-7 business days.</p>
		`
				: ''
		}

		<p>We're sorry to see you cancel. If you'd like to make another booking, you can browse our available spaces anytime.</p>

		<a href="${
			process.env.NEXT_PUBLIC_APP_URL
		}/spaces" class="button">Browse Spaces</a>

		<p>If you have any questions, please don't hesitate to contact us.</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Booking Cancelled - ${booking.bookingNumber}`,
		html: createEmailTemplate(content),
	};
}

export function createCheckInNotificationEmail(
	booking: Booking & {
		user: { name: string; email: string };
		space: { name: string };
	}
): {
	subject: string;
	html: string;
} {
	const checkInTime = booking.checkInTime
		? format(new Date(booking.checkInTime), 'h:mm a')
		: 'N/A';

	const content = `
		<h2>Checked In Successfully! ✅</h2>
		<p>Hi ${booking.user.name},</p>
		<p>You've successfully checked in to ${booking.space.name}.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Check-in Details</strong></p>
			<p style="margin: 10px 0 0 0;">Booking ID: ${booking.bookingNumber}</p>
			<p style="margin: 5px 0 0 0;">Space: ${booking.space.name}</p>
			<p style="margin: 5px 0 0 0;">Check-in Time: ${checkInTime}</p>
		</div>

		<p>Enjoy your time at AMG Workspace! If you need any assistance, our staff are here to help.</p>

		<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}" class="button">View Booking</a>

		<p>Have a productive session!</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Checked In - ${booking.space.name}`,
		html: createEmailTemplate(content),
	};
}

// ============================================
// SUBSCRIPTION/MEMBERSHIP EMAILS
// ============================================

export function createSubscriptionConfirmationEmail(
	membership: Membership & {
		user: { name: string; email: string };
		space: { name: string };
		pricingPlan: { name: string };
	}
): {
	subject: string;
	html: string;
} {
	const formattedTotal = `₦${(
		membership.totalAmount / 100
	).toLocaleString()}`;
	const startDate = format(new Date(membership.startDate), 'MMMM d, yyyy');
	const endDate = format(new Date(membership.endDate), 'MMMM d, yyyy');

	const content = `
		<h2>Subscription Activated! 🎉</h2>
		<p>Hi ${membership.user.name},</p>
		<p>Your subscription has been activated and payment received. Welcome to AMG Workspace!</p>

		<div class="info-box">
			<p style="margin: 0; font-size: 18px;"><strong>Membership ID: ${
				membership.membershipNumber
			}</strong></p>
		</div>

		<h3 style="margin-top: 30px;">Subscription Details</h3>
		<div class="detail-row">
			<span class="detail-label">Space:</span>
			<span class="detail-value">${membership.space.name}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Plan:</span>
			<span class="detail-value">${membership.pricingPlan.name}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Type:</span>
			<span class="detail-value">${membership.type}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Start Date:</span>
			<span class="detail-value">${startDate}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">End Date:</span>
			<span class="detail-value">${endDate}</span>
		</div>
		${
			membership.assignedDesk
				? `
		<div class="detail-row">
			<span class="detail-label">Desk Number:</span>
			<span class="detail-value">#${membership.assignedDesk}</span>
		</div>
		`
				: ''
		}

		<div class="divider"></div>

		<h3>Payment Summary</h3>
		<div class="detail-row" style="border-top: 2px solid #FDB913; padding-top: 10px; margin-top: 10px;">
			<span class="detail-label" style="font-size: 18px;"><strong>Total Paid:</strong></span>
			<span class="detail-value" style="font-size: 18px; color: #2B2B2B;"><strong>${formattedTotal}</strong></span>
		</div>

		<a href="${
			process.env.NEXT_PUBLIC_APP_URL
		}/dashboard/subscriptions" class="button">View Subscription Details</a>

		<div class="info-box" style="margin-top: 30px;">
			<p style="margin: 0;"><strong>📍 Getting Started:</strong></p>
			<ul style="margin: 10px 0 0 0; padding-left: 20px;">
				<li>Visit us during business hours</li>
				<li>Bring a valid ID for first-time access</li>
				<li>Your desk assignment (if applicable) is shown above</li>
			</ul>
		</div>

		<p style="margin-top: 30px;">Welcome to the community!</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Subscription Activated - ${membership.space.name} (${membership.membershipNumber})`,
		html: createEmailTemplate(content),
	};
}

export function createSubscriptionRenewalEmail(
	membership: Membership & {
		user: { name: string; email: string };
		space: { name: string };
	}
): {
	subject: string;
	html: string;
} {
	const newEndDate = format(new Date(membership.endDate), 'MMMM d, yyyy');

	const content = `
		<h2>Subscription Renewed! 🔄</h2>
		<p>Hi ${membership.user.name},</p>
		<p>Your subscription has been successfully renewed.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Membership ID: ${membership.membershipNumber}</strong></p>
			<p style="margin: 10px 0 0 0;">Space: ${membership.space.name}</p>
			<p style="margin: 5px 0 0 0;">New End Date: ${newEndDate}</p>
		</div>

		<p>Your subscription is now active and you can continue enjoying all the benefits of AMG Workspace.</p>

		<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions" class="button">View Subscription</a>

		<p>Thank you for being a valued member!</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Subscription Renewed - ${membership.membershipNumber}`,
		html: createEmailTemplate(content),
	};
}

export function createSubscriptionCancellationEmail(
	membership: Membership & {
		user: { name: string; email: string };
		space: { name: string };
	}
): {
	subject: string;
	html: string;
} {
	const endDate = format(new Date(membership.endDate), 'MMMM d, yyyy');

	const content = `
		<h2>Subscription Cancelled</h2>
		<p>Hi ${membership.user.name},</p>
		<p>Your subscription has been cancelled as requested.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Membership ID: ${membership.membershipNumber}</strong></p>
			<p style="margin: 10px 0 0 0;">Space: ${membership.space.name}</p>
			<p style="margin: 5px 0 0 0;">Access Until: ${endDate}</p>
		</div>

		<p>You will continue to have access to the space until ${endDate}.</p>

		<p>We're sorry to see you go. If there's anything we could have done better, we'd love to hear from you.</p>

		<a href="${process.env.NEXT_PUBLIC_APP_URL}/spaces" class="button">Explore Other Spaces</a>

		<p>If you change your mind, you can always subscribe again.</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Subscription Cancelled - ${membership.membershipNumber}`,
		html: createEmailTemplate(content),
	};
}

export function createSubscriptionPausedEmail(
	membership: Membership & {
		user: { name: string; email: string };
		space: { name: string };
	}
): {
	subject: string;
	html: string;
} {
	const content = `
		<h2>Subscription Paused</h2>
		<p>Hi ${membership.user.name},</p>
		<p>Your subscription has been paused as requested.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Membership ID: ${membership.membershipNumber}</strong></p>
			<p style="margin: 10px 0 0 0;">Space: ${membership.space.name}</p>
			<p style="margin: 5px 0 0 0;">Status: PAUSED</p>
		</div>

		<p>Your subscription is temporarily on hold. You won't be charged during this period, but your access to the space is suspended.</p>

		<p>To resume your subscription, please log in to your dashboard.</p>

		<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions" class="button">Manage Subscription</a>

		<p>If you have any questions, please contact our support team.</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Subscription Paused - ${membership.membershipNumber}`,
		html: createEmailTemplate(content),
	};
}

// ============================================
// ENQUIRY EMAILS
// ============================================

export function createEnquiryReceivedEmailToAdmin(enquiry: {
	id: string;
	name: string;
	email: string;
	phone?: string | null;
	company?: string | null;
	subject: string;
	message: string;
	spaceName?: string;
}): {
	subject: string;
	html: string;
} {
	const content = `
		<h2>New Enquiry Received 📬</h2>
		<p>A new enquiry has been submitted on the website.</p>

		<h3>Contact Information</h3>
		<div class="detail-row">
			<span class="detail-label">Name:</span>
			<span class="detail-value">${enquiry.name}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Email:</span>
			<span class="detail-value">${enquiry.email}</span>
		</div>
		${
			enquiry.phone
				? `
		<div class="detail-row">
			<span class="detail-label">Phone:</span>
			<span class="detail-value">${enquiry.phone}</span>
		</div>
		`
				: ''
		}
		${
			enquiry.company
				? `
		<div class="detail-row">
			<span class="detail-label">Company:</span>
			<span class="detail-value">${enquiry.company}</span>
		</div>
		`
				: ''
		}
		${
			enquiry.spaceName
				? `
		<div class="detail-row">
			<span class="detail-label">Interested In:</span>
			<span class="detail-value">${enquiry.spaceName}</span>
		</div>
		`
				: ''
		}

		<div class="divider"></div>

		<h3>Enquiry Details</h3>
		<div class="info-box">
			<p style="margin: 0;"><strong>Subject:</strong> ${enquiry.subject}</p>
			<p style="margin: 10px 0 0 0;"><strong>Message:</strong></p>
			<p style="margin: 10px 0 0 0;">${enquiry.message}</p>
		</div>

		<a href="${
			process.env.NEXT_PUBLIC_APP_URL
		}/admin/dashboard" class="button">View in Dashboard</a>

		<p>Please respond to this enquiry as soon as possible.</p>
	`;

	return {
		subject: `New Enquiry: ${enquiry.subject}`,
		html: createEmailTemplate(content),
	};
}

export function createEnquiryConfirmationEmailToUser(enquiry: {
	name: string;
	subject: string;
}): {
	subject: string;
	html: string;
} {
	const content = `
		<h2>Thank You for Your Enquiry! 📬</h2>
		<p>Hi ${enquiry.name},</p>
		<p>We've received your enquiry and our team will get back to you within 24 hours.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Your Enquiry:</strong> ${enquiry.subject}</p>
		</div>

		<p>In the meantime, you can explore our spaces and services on our website.</p>

		<a href="${process.env.NEXT_PUBLIC_APP_URL}/spaces" class="button">Explore Spaces</a>

		<p>If your enquiry is urgent, please call us directly.</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: 'Thank You for Your Enquiry - AMG Workspace',
		html: createEmailTemplate(content),
	};
}

// ============================================
// PAYMENT EMAILS
// ============================================

export function createPaymentFailedEmail(
	user: { name: string; email: string },
	reference: string,
	amount: number
): {
	subject: string;
	html: string;
} {
	const formattedAmount = `₦${(amount / 100).toLocaleString()}`;

	const content = `
		<h2>Payment Failed ❌</h2>
		<p>Hi ${user.name},</p>
		<p>We encountered an issue processing your payment.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Reference:</strong> ${reference}</p>
			<p style="margin: 10px 0 0 0;"><strong>Amount:</strong> ${formattedAmount}</p>
		</div>

		<p><strong>What you can do:</strong></p>
		<ul>
			<li>Check your card details and try again</li>
			<li>Ensure you have sufficient funds</li>
			<li>Contact your bank if the issue persists</li>
			<li>Try a different payment method</li>
		</ul>

		<a href="${process.env.NEXT_PUBLIC_APP_URL}/booking" class="button">Try Again</a>

		<p>If you continue to experience issues, please contact our support team.</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: 'Payment Failed - AMG Workspace',
		html: createEmailTemplate(content),
	};
}

export function createRefundConfirmationEmail(
	payment: Payment & {
		user: { name: string; email: string };
	}
): {
	subject: string;
	html: string;
} {
	const formattedAmount = `₦${(payment.amount / 100).toLocaleString()}`;
	const refundDate = payment.refundedAt
		? format(new Date(payment.refundedAt), 'MMMM d, yyyy')
		: 'N/A';

	const content = `
		<h2>Refund Processed 💰</h2>
		<p>Hi ${payment.user.name},</p>
		<p>Your refund has been processed successfully.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Reference:</strong> ${payment.reference}</p>
			<p style="margin: 10px 0 0 0;"><strong>Refund Amount:</strong> ${formattedAmount}</p>
			<p style="margin: 5px 0 0 0;"><strong>Processed On:</strong> ${refundDate}</p>
		</div>

		${
			payment.refundReason
				? `
		<p><strong>Reason:</strong> ${payment.refundReason}</p>
		`
				: ''
		}

		<p>The refund will appear in your account within 5-7 business days, depending on your bank.</p>

		<a href="${
			process.env.NEXT_PUBLIC_APP_URL
		}/dashboard" class="button">View Dashboard</a>

		<p>If you have any questions about this refund, please contact our support team.</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: 'Refund Processed - AMG Workspace',
		html: createEmailTemplate(content),
	};
}

// ============================================
// TEAM MEMBER EMAILS
// ============================================

export function createTeamMemberInvitationEmail(data: {
	memberName: string;
	memberEmail: string;
	ownerName: string;
	spaceName: string;
	companyName?: string;
	invitationToken: string;
	accessCode: string;
}): {
	subject: string;
	html: string;
} {
	const acceptLink = `${process.env.NEXT_PUBLIC_APP_URL}/team/invite/${data.invitationToken}`;
	const teamName = data.companyName || data.spaceName;

	const content = `
		<h2>You're Invited to Join a Team! 🎉</h2>
		<p>Hi ${data.memberName},</p>
		<p><strong>${data.ownerName}</strong> has invited you to join their workspace team at AMG Workspace.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Team:</strong> ${teamName}</p>
			<p style="margin: 10px 0 0 0;"><strong>Workspace:</strong> ${data.spaceName}</p>
		</div>

		<p>By joining this team, you'll get:</p>
		<ul>
			<li>Your own personal QR code for check-in</li>
			<li>Access to track your attendance history</li>
			<li>Notifications about your workspace activity</li>
		</ul>

		<a href="${acceptLink}" class="button">Accept Invitation</a>

		<p>Or copy and paste this link:</p>
		<p style="word-break: break-all; color: #FDB913;">${acceptLink}</p>

		<div class="divider"></div>

		<div class="info-box">
			<p style="margin: 0;"><strong>Your Access Code:</strong></p>
			<p style="margin: 10px 0 0 0; font-size: 24px; font-family: monospace; letter-spacing: 2px;"><strong>${data.accessCode}</strong></p>
			<p style="margin: 10px 0 0 0; font-size: 14px;">You can use this code even before accepting the invitation.</p>
		</div>

		<p style="margin-top: 30px;"><strong>Note:</strong> This invitation expires in 7 days.</p>

		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `${data.ownerName} invited you to join ${teamName} - AMG Workspace`,
		html: createEmailTemplate(content),
	};
}

export function createTeamMemberQRCodeEmail(data: {
	memberName: string;
	memberEmail: string;
	spaceName: string;
	companyName?: string;
	accessCode: string;
	qrCodeDataUrl: string;
}): {
	subject: string;
	html: string;
} {
	const teamName = data.companyName || data.spaceName;
	const portalLink = `${process.env.NEXT_PUBLIC_APP_URL}/team/portal/${data.accessCode}`;

	const content = `
		<h2>Your Workspace QR Code 📱</h2>
		<p>Hi ${data.memberName},</p>
		<p>Here's your personal QR code for checking in at <strong>${teamName}</strong>.</p>

		<div style="text-align: center; margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 12px;">
			<img src="${data.qrCodeDataUrl}" alt="Your QR Code" style="max-width: 250px; border: 3px solid #FDB913; border-radius: 12px; padding: 10px; background: white;" />
			<p style="margin-top: 15px; font-size: 18px; font-family: monospace; letter-spacing: 2px;"><strong>${data.accessCode}</strong></p>
		</div>

		<div class="info-box">
			<p style="margin: 0;"><strong>How to use:</strong></p>
			<ul style="margin: 10px 0 0 0; padding-left: 20px;">
				<li>Show this QR code at reception when you arrive</li>
				<li>The staff will scan it to check you in</li>
				<li>Scan again when leaving to check out</li>
			</ul>
		</div>

		<p style="margin-top: 20px;">You can also access your check-in history and QR code anytime:</p>
		<a href="${portalLink}" class="button">View Portal</a>

		<div class="divider"></div>

		<p><strong>💡 Pro tip:</strong> Save this QR code to your phone's photos or add it to your digital wallet for quick access!</p>

		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Your QR Code for ${teamName} - AMG Workspace`,
		html: createEmailTemplate(content),
	};
}

// ============================================
// VISITOR EMAILS
// ============================================

export function createVisitorInviteEmail(data: {
	visitorName: string;
	visitorEmail: string;
	hostName: string;
	accessCode: string;
	validFrom: Date;
	validUntil: Date;
	purpose: string;
	company?: string;
}): {
	subject: string;
	html: string;
} {
	const validFromStr = format(new Date(data.validFrom), 'EEEE, MMMM d, yyyy');
	const validUntilStr = format(
		new Date(data.validUntil),
		'EEEE, MMMM d, yyyy'
	);
	const timeStr = format(new Date(data.validFrom), 'h:mm a');

	const content = `
		<h2>You're Invited to Visit AMG Workspace! 👋</h2>
		<p>Hi ${data.visitorName},</p>
		<p><strong>${
			data.hostName
		}</strong> has registered you as a visitor at AMG Workspace.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Your Visitor Pass</strong></p>
			<p style="margin: 15px 0 0 0; font-size: 28px; font-family: monospace; letter-spacing: 3px; text-align: center;"><strong>${
				data.accessCode
			}</strong></p>
		</div>

		<h3 style="margin-top: 30px;">Visit Details</h3>
		<div class="detail-row">
			<span class="detail-label">Purpose:</span>
			<span class="detail-value">${data.purpose}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Host:</span>
			<span class="detail-value">${data.hostName}</span>
		</div>
		${
			data.company
				? `
		<div class="detail-row">
			<span class="detail-label">Company:</span>
			<span class="detail-value">${data.company}</span>
		</div>
		`
				: ''
		}
		<div class="detail-row">
			<span class="detail-label">Valid From:</span>
			<span class="detail-value">${validFromStr} at ${timeStr}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Valid Until:</span>
			<span class="detail-value">${validUntilStr}</span>
		</div>

		<div class="divider"></div>

		<h3>What to Do on Arrival</h3>
		<ol style="line-height: 2;">
			<li>Go to the reception desk at AMG Workspace</li>
			<li>Provide your access code: <strong>${data.accessCode}</strong></li>
			<li>A staff member will check you in</li>
			<li>Your host will be notified of your arrival</li>
		</ol>

		<div class="info-box" style="margin-top: 20px;">
			<p style="margin: 0;"><strong>📍 Location:</strong></p>
			<p style="margin: 10px 0 0 0;">AMG Workspace, Lagos, Nigeria</p>
		</div>

		<p style="margin-top: 30px;">We look forward to seeing you!</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Visitor Pass from ${data.hostName} - AMG Workspace`,
		html: createEmailTemplate(content),
	};
}

export function createVisitorQRCodeEmail(data: {
	visitorName: string;
	visitorEmail: string;
	hostName: string;
	accessCode: string;
	validFrom: Date;
	validUntil: Date;
	qrCodeDataUrl: string;
}): {
	subject: string;
	html: string;
} {
	const validFromStr = format(new Date(data.validFrom), 'EEEE, MMMM d, yyyy');
	const validUntilStr = format(
		new Date(data.validUntil),
		'EEEE, MMMM d, yyyy'
	);

	const content = `
		<h2>Your Visitor QR Code 📱</h2>
		<p>Hi ${data.visitorName},</p>
		<p>Here's your QR code for your visit to AMG Workspace.</p>

		<div style="text-align: center; margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 12px;">
			<img src="${data.qrCodeDataUrl}" alt="Visitor QR Code" style="max-width: 250px; border: 3px solid #FDB913; border-radius: 12px; padding: 10px; background: white;" />
			<p style="margin-top: 15px; font-size: 18px; font-family: monospace; letter-spacing: 2px;"><strong>${data.accessCode}</strong></p>
		</div>

		<div class="info-box">
			<p style="margin: 0;"><strong>Pass Valid:</strong></p>
			<p style="margin: 10px 0 0 0;">${validFromStr} - ${validUntilStr}</p>
			<p style="margin: 10px 0 0 0;"><strong>Host:</strong> ${data.hostName}</p>
		</div>

		<p style="margin-top: 20px;">Show this QR code at reception when you arrive. Save it to your phone for easy access!</p>

		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Your Visitor QR Code - AMG Workspace`,
		html: createEmailTemplate(content),
	};
}

export function createVisitorCheckInNotificationEmail(data: {
	hostName: string;
	visitorName: string;
	visitorCompany?: string;
	purpose: string;
	checkInTime: Date;
}): {
	subject: string;
	html: string;
} {
	const checkInTimeStr = format(new Date(data.checkInTime), 'h:mm a');
	const checkInDateStr = format(
		new Date(data.checkInTime),
		'EEEE, MMMM d, yyyy'
	);

	const content = `
		<h2>Your Visitor Has Arrived! 👋</h2>
		<p>Hi ${data.hostName},</p>
		<p>Your visitor has checked in at AMG Workspace reception.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Visitor:</strong> ${data.visitorName}</p>
			${
				data.visitorCompany
					? `<p style="margin: 5px 0 0 0;"><strong>Company:</strong> ${data.visitorCompany}</p>`
					: ''
			}
			<p style="margin: 5px 0 0 0;"><strong>Purpose:</strong> ${data.purpose}</p>
			<p style="margin: 10px 0 0 0;"><strong>Checked in at:</strong> ${checkInTimeStr} on ${checkInDateStr}</p>
		</div>

		<p>Please proceed to meet your visitor at the reception area.</p>

		<a href="${
			process.env.NEXT_PUBLIC_APP_URL
		}/dashboard/visitors" class="button">View Visitors</a>

		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `${data.visitorName} has arrived - AMG Workspace`,
		html: createEmailTemplate(content),
	};
}

// ============================================
// TOUR BOOKING EMAILS
// ============================================

export function createTourRequestEmail(data: {
	name: string;
	email: string;
	preferredDate: Date;
	interestedIn?: string;
}): {
	subject: string;
	html: string;
} {
	const preferredDateStr = format(
		new Date(data.preferredDate),
		'EEEE, MMMM d, yyyy'
	);
	const preferredTimeStr = format(new Date(data.preferredDate), 'h:mm a');

	const content = `
		<h2>Tour Request Received! 🏢</h2>
		<p>Hi ${data.name},</p>
		<p>Thank you for your interest in AMG Workspace! We've received your tour request.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Your Requested Time:</strong></p>
			<p style="margin: 10px 0 0 0; font-size: 18px;">${preferredDateStr} at ${preferredTimeStr}</p>
			${
				data.interestedIn
					? `<p style="margin: 10px 0 0 0;"><strong>Interested in:</strong> ${data.interestedIn}</p>`
					: ''
			}
		</div>

		<h3 style="margin-top: 30px;">What Happens Next?</h3>
		<ol style="line-height: 2;">
			<li>Our team will review your request</li>
			<li>We'll confirm your appointment or suggest an alternative time</li>
			<li>You'll receive a confirmation email with all the details</li>
		</ol>

		<p>We typically respond within 24 hours during business days.</p>

		<div class="info-box" style="margin-top: 20px;">
			<p style="margin: 0;"><strong>📍 Location:</strong></p>
			<p style="margin: 10px 0 0 0;">AMG Workspace, Lagos, Nigeria</p>
		</div>

		<p style="margin-top: 30px;">Questions? Reply to this email or call us.</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: 'Tour Request Received - AMG Workspace',
		html: createEmailTemplate(content),
	};
}

export function createTourConfirmationEmail(data: {
	name: string;
	email: string;
	confirmedDate: Date;
	duration: number;
	isRescheduled?: boolean;
}): {
	subject: string;
	html: string;
} {
	const confirmedDateStr = format(
		new Date(data.confirmedDate),
		'EEEE, MMMM d, yyyy'
	);
	const confirmedTimeStr = format(new Date(data.confirmedDate), 'h:mm a');

	const content = `
		<h2>${data.isRescheduled ? 'Tour Rescheduled!' : 'Tour Confirmed!'} ✅</h2>
		<p>Hi ${data.name},</p>
		<p>${
			data.isRescheduled
				? 'Your workspace tour has been rescheduled.'
				: 'Great news! Your workspace tour has been confirmed.'
		}</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>📅 Your Appointment:</strong></p>
			<p style="margin: 15px 0 0 0; font-size: 22px; font-weight: bold;">${confirmedDateStr}</p>
			<p style="margin: 5px 0 0 0; font-size: 18px;">at ${confirmedTimeStr}</p>
			<p style="margin: 10px 0 0 0;"><strong>Duration:</strong> ~${
				data.duration
			} minutes</p>
		</div>

		<h3 style="margin-top: 30px;">What to Expect</h3>
		<ul style="line-height: 2;">
			<li>A guided tour of our workspace facilities</li>
			<li>Overview of membership plans and pricing</li>
			<li>Q&A session with our team</li>
			<li>No obligation - just explore what we offer!</li>
		</ul>

		<div class="info-box" style="margin-top: 20px;">
			<p style="margin: 0;"><strong>📍 Location:</strong></p>
			<p style="margin: 10px 0 0 0;">AMG Workspace, Lagos, Nigeria</p>
		</div>

		<h3 style="margin-top: 30px;">Need to Reschedule?</h3>
		<p>No problem! Just reply to this email or contact us at least 24 hours before your appointment.</p>

		<p style="margin-top: 30px;">We look forward to showing you around!</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `${
			data.isRescheduled ? 'Tour Rescheduled' : 'Tour Confirmed'
		} - ${confirmedDateStr} - AMG Workspace`,
		html: createEmailTemplate(content),
	};
}

export function createTourReminderEmail(data: {
	name: string;
	tourDate: Date;
	duration: number;
}): {
	subject: string;
	html: string;
} {
	const tourDateStr = format(new Date(data.tourDate), 'EEEE, MMMM d, yyyy');
	const tourTimeStr = format(new Date(data.tourDate), 'h:mm a');

	const content = `
		<h2>Reminder: Your Tour is Tomorrow! 🔔</h2>
		<p>Hi ${data.name},</p>
		<p>This is a friendly reminder about your upcoming workspace tour at AMG Workspace.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>📅 Tomorrow:</strong></p>
			<p style="margin: 15px 0 0 0; font-size: 22px; font-weight: bold;">${tourDateStr}</p>
			<p style="margin: 5px 0 0 0; font-size: 18px;">at ${tourTimeStr}</p>
			<p style="margin: 10px 0 0 0;"><strong>Duration:</strong> ~${data.duration} minutes</p>
		</div>

		<div class="info-box" style="margin-top: 20px;">
			<p style="margin: 0;"><strong>📍 Location:</strong></p>
			<p style="margin: 10px 0 0 0;">AMG Workspace, Lagos, Nigeria</p>
		</div>

		<p style="margin-top: 20px;"><strong>Can't make it?</strong> Please let us know as soon as possible so we can reschedule.</p>

		<p style="margin-top: 30px;">See you tomorrow!</p>
		<p>Best regards,<br>The AMG Workspace Team</p>
	`;

	return {
		subject: `Reminder: Your Tour Tomorrow at ${tourTimeStr} - AMG Workspace`,
		html: createEmailTemplate(content),
	};
}

export function createTourAdminNotificationEmail(data: {
	name: string;
	email: string;
	phone?: string;
	company?: string;
	preferredDate: Date;
	interestedIn?: string;
	groupSize: number;
	budget?: string;
	source?: string;
	message?: string;
}): {
	subject: string;
	html: string;
} {
	const preferredDateStr = format(
		new Date(data.preferredDate),
		'EEEE, MMMM d, yyyy'
	);
	const preferredTimeStr = format(new Date(data.preferredDate), 'h:mm a');

	const content = `
		<h2>New Tour Request! 🔔</h2>
		<p>A new tour has been requested on the website.</p>

		<div class="info-box">
			<p style="margin: 0;"><strong>Contact Information:</strong></p>
			<p style="margin: 10px 0 0 0;"><strong>Name:</strong> ${data.name}</p>
			<p style="margin: 5px 0 0 0;"><strong>Email:</strong> ${data.email}</p>
			${
				data.phone
					? `<p style="margin: 5px 0 0 0;"><strong>Phone:</strong> ${data.phone}</p>`
					: ''
			}
			${
				data.company
					? `<p style="margin: 5px 0 0 0;"><strong>Company:</strong> ${data.company}</p>`
					: ''
			}
		</div>

		<div class="info-box" style="margin-top: 20px;">
			<p style="margin: 0;"><strong>Tour Details:</strong></p>
			<p style="margin: 10px 0 0 0;"><strong>Requested Date:</strong> ${preferredDateStr} at ${preferredTimeStr}</p>
			${
				data.interestedIn
					? `<p style="margin: 5px 0 0 0;"><strong>Interested in:</strong> ${data.interestedIn}</p>`
					: ''
			}
			<p style="margin: 5px 0 0 0;"><strong>Group Size:</strong> ${data.groupSize} ${
		data.groupSize > 1 ? 'people' : 'person'
	}</p>
			${
				data.budget
					? `<p style="margin: 5px 0 0 0;"><strong>Budget:</strong> ${data.budget}</p>`
					: ''
			}
			${
				data.source
					? `<p style="margin: 5px 0 0 0;"><strong>Source:</strong> ${data.source}</p>`
					: ''
			}
		</div>

		${
			data.message
				? `
		<div class="info-box" style="margin-top: 20px;">
			<p style="margin: 0;"><strong>Message:</strong></p>
			<p style="margin: 10px 0 0 0;">${data.message}</p>
		</div>
		`
				: ''
		}

		<a href="${
			process.env.NEXT_PUBLIC_APP_URL
		}/admin/tours" class="button">Review & Confirm Tour</a>

		<p style="margin-top: 30px; color: #888;">This is an automated notification from AMG Workspace.</p>
	`;

	return {
		subject: `🆕 Tour Request: ${data.name} - ${preferredDateStr}`,
		html: createEmailTemplate(content),
	};
}

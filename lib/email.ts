import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ============================================
// EMAIL CONFIGURATION
// ============================================

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
	if (transporter) {
		return transporter;
	}

	const emailConfig = {
		host: process.env.SMTP_HOST || 'smtp.gmail.com',
		port: parseInt(process.env.SMTP_PORT || '587'),
		secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASSWORD,
		},
	};

	if (!emailConfig.auth.user || !emailConfig.auth.pass) {
		console.warn(
			'Email configuration is incomplete. Emails will not be sent.'
		);
		// Return a mock transporter for development
		return {
			sendMail: async (options: any) => {
				console.log('📧 Mock Email:', {
					to: options.to,
					subject: options.subject,
					text: options.text?.substring(0, 100) + '...',
				});
				return { messageId: 'mock-id' };
			},
		} as Transporter;
	}

	transporter = nodemailer.createTransport(emailConfig);
	return transporter;
}

// ============================================
// EMAIL TYPES
// ============================================

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

// ============================================
// SEND EMAIL FUNCTION
// ============================================

export async function sendEmail(options: EmailOptions): Promise<boolean> {
	try {
		const transporter = getTransporter();
		const from =
			process.env.SMTP_FROM ||
			process.env.SMTP_USER ||
			'noreply@amgworkspace.com';

		await transporter.sendMail({
			from: `AMG Workspace <${from}>`,
			to: options.to,
			subject: options.subject,
			html: options.html,
			text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
		});

		console.log(`✅ Email sent successfully to ${options.to}`);
		return true;
	} catch (error) {
		console.error('❌ Failed to send email:', error);
		return false;
	}
}

// ============================================
// EMAIL TEMPLATE HELPER
// ============================================

export function createEmailTemplate(content: string): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AMG Workspace</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #2B2B2B;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
			background-color: #f8f9fa;
		}
		.email-container {
			background-color: #ffffff;
			border-radius: 10px;
			overflow: hidden;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		}
		.email-header {
			background-color: #2B2B2B;
			color: #ffffff;
			padding: 40px 20px;
			text-align: center;
		}
		.email-header h1 {
			margin: 0;
			font-size: 28px;
			font-weight: 700;
			color: #FDB913;
		}
		.email-body {
			padding: 30px 20px;
			color: #2B2B2B;
		}
		.button {
			display: inline-block;
			padding: 14px 32px;
			background-color: #FDB913;
			color: #2B2B2B !important;
			text-decoration: none;
			border-radius: 10px;
			font-weight: 600;
			margin: 20px 0;
			text-align: center;
			transition: background-color 0.3s ease;
		}
		.button:hover {
			background-color: #e5a610;
		}
		.info-box {
			background-color: #fef9ed;
			border-left: 4px solid #FDB913;
			padding: 16px;
			margin: 20px 0;
			border-radius: 6px;
		}
		.email-footer {
			background-color: #2B2B2B;
			padding: 24px 20px;
			text-align: center;
			font-size: 14px;
			color: #e0e0e0;
		}
		.email-footer a {
			color: #FDB913 !important;
			text-decoration: none;
		}
		.email-footer a:hover {
			text-decoration: underline;
		}
		.divider {
			height: 1px;
			background-color: #e5e5e5;
			margin: 20px 0;
		}
		.detail-row {
			margin: 10px 0;
			display: flex;
			justify-content: space-between;
		}
		.detail-label {
			color: #666666;
			font-weight: 500;
		}
		.detail-value {
			font-weight: 600;
			color: #2B2B2B;
		}
		h2 {
			color: #2B2B2B;
			margin-top: 0;
		}
		ul {
			padding-left: 20px;
		}
		ul li {
			margin: 8px 0;
			color: #2B2B2B;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>AMG Workspace</h1>
		</div>
		<div class="email-body">
			${content}
		</div>
		<div class="email-footer">
			<p><strong>AMG Workspace</strong></p>
			<p>Lagos, Nigeria</p>
			<p>
				<a href="${
					process.env.NEXT_PUBLIC_APP_URL ||
					'https://amgworkspace.com'
				}" style="color: #667eea;">Visit Our Website</a> |
				<a href="${
					process.env.NEXT_PUBLIC_APP_URL
				}/enquiry" style="color: #667eea;">Contact Support</a>
			</p>
			<p style="font-size: 12px; color: #999; margin-top: 20px;">
				You received this email because you have an account with AMG Workspace.
			</p>
		</div>
	</div>
</body>
</html>
	`;
}

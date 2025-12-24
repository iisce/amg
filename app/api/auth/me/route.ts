import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/actions/auth';

export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ user: null, message: 'Not authenticated' },
				{ status: 401 }
			);
		}

		return NextResponse.json({ user });
	} catch (error) {
		console.error('Auth check error:', error);
		return NextResponse.json(
			{ user: null, message: 'Authentication error' },
			{ status: 500 }
		);
	}
}

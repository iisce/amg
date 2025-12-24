import { NextRequest, NextResponse } from 'next/server';
import { cancelSubscription } from '@/actions';

export async function POST(req: NextRequest) {
	const { id } = await req.json();
	if (!id) {
		return NextResponse.json(
			{ success: false, message: 'Missing id' },
			{ status: 400 }
		);
	}
	const result = await cancelSubscription(id);
	if (result.success) {
		return NextResponse.json({ success: true });
	}
	return NextResponse.json(
		{ success: false, message: result.message },
		{ status: 400 }
	);
}

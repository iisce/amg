'use client';

import { useEffect, useState, useCallback } from 'react';
import type { SessionUser } from '@/actions/auth';

interface UseAuthReturn {
	user: SessionUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
	const [user, setUser] = useState<SessionUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchUser = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await fetch('/api/auth/me');
			if (response.ok) {
				const data = await response.json();
				setUser(data.user);
			} else {
				setUser(null);
			}
		} catch (error) {
			console.error('Failed to fetch user:', error);
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	return {
		user,
		isLoading,
		isAuthenticated: !!user,
		refresh: fetchUser,
	};
}

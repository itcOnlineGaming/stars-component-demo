import type { ConfidenceRating, SelfEfficacyApi, SelfEfficacyPayload } from './types';

/**
 * STAGE 2: Real HTTP API Adapter.
 *
 * Implements the exact same `SelfEfficacyApi` interface as Stage 1, but issues
 * real `fetch()` calls to the STARS backend.
 */
export function createHttpSelfEfficacyApi(baseUrl = '/stars/api/self-efficacy'): SelfEfficacyApi {
	async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
		const response = await fetch(`${baseUrl}${path}`, {
			headers: {
				'Content-Type': 'application/json',
				...(init?.headers ?? {})
			},
			...init
		});

		if (!response.ok) {
			throw new Error(`API error (${response.status}): ${response.statusText}`);
		}

		return (await response.json()) as T;
	}

	return {
		loadChecklist(): Promise<SelfEfficacyPayload> {
			return requestJson<SelfEfficacyPayload>('/checklist');
		},

		updateQuestionRating(questionId: string, rating: ConfidenceRating) {
			return requestJson<{
				questionId: string;
				rating: ConfidenceRating;
				ratings: Record<string, ConfidenceRating>;
			}>(`/questions/${encodeURIComponent(questionId)}`, {
				method: 'PATCH',
				body: JSON.stringify({ rating })
			});
		},

		resetChecklist(): Promise<SelfEfficacyPayload> {
			return requestJson<SelfEfficacyPayload>('/reset', {
				method: 'POST'
			});
		}
	};
}

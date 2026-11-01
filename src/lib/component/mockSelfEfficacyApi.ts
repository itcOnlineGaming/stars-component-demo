import fixtureData from './checklistFixture.json';
import type {
	CompetencyQuestion,
	ConfidenceRating,
	SelfEfficacyApi,
	SelfEfficacyPayload
} from './types';

/**
 * Find the question with the minimum confidence level (first in question order if tied).
 */
export function findMinimumSkill(
	questions: CompetencyQuestion[],
	ratings: Record<string, ConfidenceRating>
): { minRating: ConfidenceRating; minQuestion: CompetencyQuestion | null } {
	if (questions.length === 0) {
		return { minRating: 1, minQuestion: null };
	}

	let minQuestion = questions[0];
	let minRating: ConfidenceRating = ratings[minQuestion.id] ?? 1;

	for (const question of questions) {
		const rating: ConfidenceRating = ratings[question.id] ?? 1;
		if (rating < minRating) {
			minRating = rating;
			minQuestion = question;
		}
	}

	return { minRating, minQuestion };
}

function clonePayload(source: SelfEfficacyPayload): SelfEfficacyPayload {
	return JSON.parse(JSON.stringify(source)) as SelfEfficacyPayload;
}

export interface MockApiOptions {
	initialData?: Partial<SelfEfficacyPayload>;
	onRequestLog?: (entry: { method: string; endpoint: string; response: unknown }) => void;
}

/**
 * STAGE 1: Mock JSON API (No backend server required).
 *
 * Returns asynchronous Promises resolved from in-memory JSON state seeded by
 * `checklistFixture.json`.
 */
export function createMockSelfEfficacyApi(options: MockApiOptions = {}): SelfEfficacyApi {
	const base = clonePayload(fixtureData as SelfEfficacyPayload);
	let state: SelfEfficacyPayload = {
		...base,
		...options.initialData,
		ratings: {
			...base.ratings,
			...(options.initialData?.ratings ?? {})
		}
	};

	function logCall(method: string, endpoint: string, response: unknown) {
		options.onRequestLog?.({
			method,
			endpoint,
			response: JSON.parse(JSON.stringify(response))
		});
	}

	return {
		async loadChecklist(): Promise<SelfEfficacyPayload> {
			const payload = clonePayload(state);
			logCall('GET', '/mock/self-efficacy/checklist.json', payload);
			return payload;
		},

		async updateQuestionRating(questionId: string, rating: ConfidenceRating) {
			state.ratings = {
				...state.ratings,
				[questionId]: rating
			};
			const result = {
				questionId,
				rating,
				ratings: { ...state.ratings }
			};
			logCall('PATCH', `/mock/self-efficacy/questions/${questionId}.json`, result);
			return result;
		},

		async resetChecklist(): Promise<SelfEfficacyPayload> {
			const resetRatings: Record<string, ConfidenceRating> = {};
			for (const question of state.questions) {
				resetRatings[question.id] = 1;
			}
			state = {
				...state,
				ratings: resetRatings
			};
			const payload = clonePayload(state);
			logCall('POST', '/mock/self-efficacy/reset.json', payload);
			return payload;
		}
	};
}

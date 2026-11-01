/**
 * 1 to 5 self-efficacy confidence rating scale:
 * 1 = Not at all confident
 * 2 = Low confidence
 * 3 = Moderate confidence
 * 4 = Confident
 * 5 = Very confident
 */
export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

export interface CompetencyQuestion {
	id: string;
	questionNumber: number;
	statement: string;
}

export interface ProgressDateEntry {
	date: string;
	label: string;
	minRating: ConfidenceRating;
}

export interface SelfEfficacyPayload {
	title: string;
	history: ProgressDateEntry[];
	questions: CompetencyQuestion[];
	ratings: Record<string, ConfidenceRating>;
}

/**
 * Staged API contract passed into SelfEfficacyChecklist via `$props()`.
 *
 * - Stage 1 (Mock JSON API): `createMockSelfEfficacyApi()` returns static JSON
 *   fixture data in memory (no backend server required).
 * - Stage 2 (Real HTTP API): `createHttpSelfEfficacyApi()` calls the STARS
 *   backend endpoints while keeping the component code 100% unchanged.
 */
export interface SelfEfficacyApi {
	loadChecklist(): Promise<SelfEfficacyPayload>;
	updateQuestionRating(
		questionId: string,
		rating: ConfidenceRating
	): Promise<{
		questionId: string;
		rating: ConfidenceRating;
		ratings: Record<string, ConfidenceRating>;
	}>;
	resetChecklist(): Promise<SelfEfficacyPayload>;
}

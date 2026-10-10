// --- API response types (mirrored from tuloslista.com) ---

export type CompetitionList = {
	Id: number;
	Name: string;
	OrganizationName: string;
	Date: string;
	Stadion: { Name?: string; TrackCount: number; Type: number };
	LiveStatus: string;
	Location?: string;
};

export type CompetitionProperties = {
	Settings: { Id: number; Type: number; Index: number; StringValue: string; IntValue: number }[];
	Competition: {
		Id: number;
		Name: string;
		BeginDate: string;
		Organization: string;
	};
};

export type EventList = {
	Id: number;
	BeginDateTimeWithTZ: string;
	Category: 'Track' | 'Field' | 'Relay';
	SubCategory: string;
	EventId: number;
	EventName: string;
	Gender: string;
	Age: string;
	Name: string;
	Status: string;
	GroupName: string;
};

export type Events = Record<string, EventList[]>;

export type Organization = {
	Name: string;
	NameShort: string;
	Id: number;
};

export type Athlete = {
	Id: number;
	Index: number;
	LicenseDbId: number;
	Firstname: string;
	Surname: string;
	Gender: string;
	Organization: Organization;
};

export type Enrollment = {
	Id: number;
	Confirmed: boolean;
	NotInCompetition: boolean;
	Number: string;
	TeamId: number;
	Name: string;
	Firstname: string;
	Surname: string;
	Organization: Organization;
	Athletes: Athlete[];
};

export type Attempt = {
	Line1: string | null;
	Line2: string | null;
};

export type Allocation = {
	NotInCompetition: boolean;
	Id: number;
	// Tuloslista's event-wide final placing. Position (when present) is a lane/start position.
	ResultRank?: number | null;
	Result: string | null;
	Wind?: string | null;
	Attempts?: Attempt[];
	Name: string;
	Organization: Organization;
	AllocId?: number;
	Position?: number;
	Number?: string;
	SeuraCUPPoints?: number;
	TeamName?: string;
	TeamId?: number;
	Firstname?: string;
	Surname?: string;
	Athletes?: Athlete[];
};

export type Heat = {
	Id?: number;
	Index?: number;
	Wind?: string | null;
	Allocations: Allocation[];
};

export type Round = {
	Id?: number;
	RoundTypeCategory: string;
	Name: string;
	EventId?: number;
	Heats: Heat[];
	Status?: string;
	TotalResults?: Allocation[];
};

export type EventDetail = {
	Enrollments?: Enrollment[];
	EventCategory: 'Track' | 'Field' | 'Relay';
	RootName?: string;
	RootId?: number;
	Id: number;
	Name: string;
	BeginDateTimeWithTZ: string;
	Gender?: string;
	Rounds: Round[];
	Group: string;
};

// --- SFIM-specific types ---

export type AgeClass = 'senior' | 'junior';
export type Gender = 'male' | 'female';

export type PerformanceClass = 'SM' | 'M' | 'A' | 'none';

export type ScoredResult = {
	athleteName: string;
	club: Organization;
	result: string;
	parsedValue: number;
	category: 'Track' | 'Field' | 'Relay';
	ageClass: AgeClass;
	gender: Gender;
	placement: number;
	tieCount: number;
	placementPoints: number;
	performanceClass: PerformanceClass;
	resultPoints: number;
	totalPoints: number;
	isValid: boolean;
};

export type ClubEventScore = {
	eventId: number;
	eventName: string;
	athleteName: string;
	result: string;
	placement: number;
	placementPoints: number;
	performanceClass: PerformanceClass;
	resultPoints: number;
	points: number;
	category: 'Track' | 'Field' | 'Relay';
	ageClass: AgeClass;
};

export type ClubScore = {
	club: Organization;
	totalPoints: number;
	events: ClubEventScore[];
	// Set only when a published organizer total replaces a calculated total.
	calculatedPoints?: number;
	officialAdjustment?: number;
};

export type TrophyResult = {
	trophy: 'frihetspriset' | 'ungdomspokalen';
	rankings: ClubScore[];
	eventBreakdown: { eventName: string; eventId: number; results: ScoredResult[] }[];
};

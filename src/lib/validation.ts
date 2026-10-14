import type { EventDetail } from './types.js';

// Runtime guards for Tuloslista result payloads. The same checks apply to the
// live feed and browser snapshots, so scoring never sees malformed rows.

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptional<T>(value: unknown, guard: (value: unknown) => value is T): boolean {
	return value === undefined || value === null || guard(value);
}

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function isOrganization(value: unknown): boolean {
	return isRecord(value) && isFiniteNumber(value.Id) && isString(value.Name) && isOptional(value.NameShort, isString);
}

function isAttempt(value: unknown): boolean {
	return isRecord(value) && isOptional(value.Line1, isString) && isOptional(value.Line2, isString);
}

function isAllocation(value: unknown): boolean {
	return isRecord(value) &&
		isString(value.Name) &&
		isOrganization(value.Organization) &&
		isOptional(value.Result, isString) &&
		isOptional(value.NotInCompetition, isBoolean) &&
		isOptional(value.ResultRank, isFiniteNumber) &&
		isOptional(value.Wind, isString) &&
		(value.Attempts === undefined || value.Attempts === null ||
			(Array.isArray(value.Attempts) && value.Attempts.every(isAttempt)));
}

function isAllocationList(value: unknown): boolean {
	return Array.isArray(value) && value.every(isAllocation);
}

function isHeat(value: unknown): boolean {
	return isRecord(value) && isOptional(value.Wind, isString) && isAllocationList(value.Allocations);
}

function isRound(value: unknown): boolean {
	return isRecord(value) &&
		isString(value.Name) &&
		isString(value.RoundTypeCategory) &&
		Array.isArray(value.Heats) && value.Heats.every(isHeat) &&
		(value.TotalResults === undefined || value.TotalResults === null || isAllocationList(value.TotalResults));
}

export function isEventDetail(value: unknown, eventId?: number): value is EventDetail {
	return isRecord(value) &&
		isFiniteNumber(value.Id) &&
		(eventId === undefined || value.Id === eventId) &&
		isString(value.Name) &&
		isString(value.Group) &&
		isString(value.BeginDateTimeWithTZ) &&
		(value.EventCategory === 'Track' || value.EventCategory === 'Field' || value.EventCategory === 'Relay') &&
		Array.isArray(value.Rounds) && value.Rounds.every(isRound);
}

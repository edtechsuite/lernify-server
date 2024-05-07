import { calculateRate } from './attendanceRate'

describe('attendanceRate', () => {
	it('should return empty map when no attendance record', () => {
		expect(calculateRate([])).toEqual(new Map())
	})
	it('should return 0 when total is 0', () => {
		expect(
			calculateRate([
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {},
				},
			])
		).toEqual(new Map([['group', new Map()]]))
	})

	it('should return 0 when attended is 0', () => {
		expect(
			calculateRate([
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: false,
					},
				},
			])
		).toEqual(
			new Map([
				['group', new Map([['st1', { attended: 0, rate: 0, total: 1 }]])],
			])
		)
	})

	it('should return 100 when total is equal to attended', () => {
		expect(
			calculateRate([
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
					},
				},
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
					},
				},
			])
		).toEqual(
			new Map([
				['group', new Map([['st1', { attended: 2, rate: 1, total: 2 }]])],
			])
		)
	})

	it('should return 50 when total is double the attended', () => {
		expect(
			calculateRate([
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
					},
				},
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: false,
					},
				},
			])
		).toEqual(
			new Map([
				['group', new Map([['st1', { attended: 1, rate: 0.5, total: 2 }]])],
			])
		)
	})

	it('should return 33.33 when total is triple the attended', () => {
		expect(
			calculateRate([
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
					},
				},
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: false,
					},
				},
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: false,
					},
				},
			])
		).toEqual(
			new Map([
				['group', new Map([['st1', { attended: 1, rate: 0.3333, total: 3 }]])],
			])
		)
	})

	it('should return 66.67 when total is triple the attended', () => {
		expect(
			calculateRate([
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
					},
				},
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
					},
				},
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: false,
					},
				},
			])
		).toEqual(
			new Map([
				['group', new Map([['st1', { attended: 2, rate: 0.6667, total: 3 }]])],
			])
		)
	})
	it('should return rate for different attendee', () => {
		expect(
			calculateRate([
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
						st2: true,
						st3: true,
					},
				},
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
						st2: false,
						st3: false,
					},
				},
				{
					teacher: 'teacher',
					group: 'group',
					date: 0,
					attended: {
						st1: true,
						st2: true,
						st3: false,
					},
				},
			])
		).toEqual(
			new Map([
				[
					'group',
					new Map([
						['st1', { attended: 3, rate: 1, total: 3 }],
						['st2', { attended: 2, rate: 0.6667, total: 3 }],
						['st3', { attended: 1, rate: 0.3333, total: 3 }],
					]),
				],
			])
		)
	})
})

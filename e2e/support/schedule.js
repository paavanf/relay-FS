// schedule.js
// Finding things on the Schedule page the way a person would: a roster by
// its picker, a person's row by their name, a day by its column.

import { expect } from '@playwright/test';

/** One roster's grid. The table is named by its caption. */
export function gridOf(page, roster) {
  return page.getByRole('table', { name: `${roster.name}: shifts from ${roster.startDate} to ${roster.endDate}` });
}

/** Picks the roster in the picker and waits for its grid. */
export async function showRoster(page, roster) {
  await page.getByLabel('Choose a roster').selectOption(roster.id);
  await expect(gridOf(page, roster)).toBeVisible();
}

export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function addDays(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export const THURSDAY = 4; // as Date.getUTCDay() counts, from Sunday = 0

/** The first date in the roster falling on that day of the week. */
export function firstWeekday(roster, weekday) {
  const days = daysBetween(roster.startDate, roster.endDate) + 1;
  const dates = Array.from({ length: days }, (_, i) => addDays(roster.startDate, i));
  return dates.find((date) => new Date(`${date}T00:00:00Z`).getUTCDay() === weekday);
}

/** The button in one person's cell on one date. */
export function cellButton(page, roster, memberName, date) {
  const row = gridOf(page, roster)
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: memberName, exact: true }) });
  return row.getByRole('cell').nth(daysBetween(roster.startDate, date)).getByRole('button');
}

/** Opens a cell's dialog and picks a shift, leaving the verdict on screen. */
export async function tryShift(page, roster, memberName, date, shiftName) {
  await cellButton(page, roster, memberName, date).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: memberName })).toBeVisible();
  await dialog.getByRole('radio', { name: new RegExp(`^${shiftName}\\b`) }).check();
  await expect(dialog.getByText('Checking the rules...')).toBeHidden();
  return dialog;
}

/**
 * Chart tabs, for the suites.
 *
 * Eight tabs sit on the strip and the rest are behind one "More"
 * control, so a test that wants a tab should not have to know which
 * side of that line it is on. `tab()` clicks it either way.
 *
 * The care plan is one document again, not four tabs, so a suite that
 * used to click Subjective or Plan asks `soap()` for that letter of
 * it instead.
 */
const LETTER = { S: 0, O: 1, A: 2, P: 3 };

/** The strip's own tabs, not the More button that borrows the class. */
const strip = (p, name) => p.locator(`.ctabs > .ctab:has-text("${name}")`);

async function tab(p, name) {
  if (await strip(p, name).count()) {
    await strip(p, name).first().click();
  } else {
    await p.click('.ctabmore > .ctab');
    await p.waitForTimeout(180);
    await p.click(`.moremenu button:has-text("${name}")`);
  }
  await p.waitForTimeout(420);
}

/** Is the tab reachable at all, on the strip or behind More. */
async function hasTab(p, name) {
  if (await strip(p, name).count()) return true;
  if (!(await p.locator('.ctabmore > .ctab').count())) return false;
  await p.click('.ctabmore > .ctab');
  await p.waitForTimeout(180);
  const n = await p.locator(`.moremenu button:has-text("${name}")`).count();
  await p.click('.ctabmore > .ctab');
  await p.waitForTimeout(150);
  return n > 0;
}

/** One letter of the care plan, as flattened text. */
async function soap(p, letter) {
  await tab(p, 'Care plan');
  return (await p.locator('.soap').nth(LETTER[letter]).textContent()).replace(/\s+/g, ' ');
}

/** The care plan, scrolled to one letter, for assertions on its parts. */
async function section(p, letter) {
  await tab(p, 'Care plan');
  return p.locator('.soap').nth(LETTER[letter]);
}

module.exports = { tab, hasTab, soap, section, LETTER };

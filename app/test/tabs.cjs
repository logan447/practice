/**
 * Chart tabs, for the suites.
 *
 * Seven tabs sit on the strip. The ten rarely-wanted ones moved off
 * the chart entirely and are reached from the account menu under
 * "This chart", so `tab()` looks in both places.
 *
 * The care plan is no longer a tab at all. It is written inside an
 * encounter and read one problem at a time from the right column, so
 * a suite that wants a letter of it opens an encounter instead.
 */
const strip = (p, name) => p.locator(`.ctabs > .ctab:has-text("${name}")`);

async function tab(p, name) {
  if (await strip(p, name).count()) {
    await strip(p, name).first().click();
  } else {
    if (!(await p.locator('.acctmenu').count())) await p.click('.acctbtn');
    await p.waitForTimeout(180);
    await p.click(`.acctsec:has(.acctlabel) .acctrow:has-text("${name}")`);
  }
  await p.waitForTimeout(420);
}

/** Is the tab reachable at all, on the strip or in the menu. */
async function hasTab(p, name) {
  if (await strip(p, name).count()) return true;
  await p.click('.acctbtn');
  await p.waitForTimeout(180);
  const n = await p.locator(`.acctsec:has(.acctlabel) .acctrow:has-text("${name}")`).count();
  // Close it the way it opened. Anything else leaves the menu up, and
  // the next open would toggle it shut instead.
  await p.click('.acctbtn');
  await p.waitForTimeout(200);
  return n > 0;
}

/** Open a record row by its visible name, and wait for the sheet. */
async function openRec(p, name) {
  await p.click(`.rec:has-text("${name}")`);
  await p.waitForTimeout(350);
}

const closeSheet = async (p) => { await p.click('.sheetx'); await p.waitForTimeout(250); };

module.exports = { tab, hasTab, openRec, closeSheet };

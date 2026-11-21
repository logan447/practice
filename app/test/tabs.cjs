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
    await palette(p, name);
  }
  await p.waitForTimeout(420);
}

/** Run a command by name. The menu is four rows; this is the rest. */
async function palette(p, label) {
  await p.keyboard.press('Meta+k'); await p.waitForTimeout(280);
  await p.keyboard.type(label); await p.waitForTimeout(320);
  await p.keyboard.press('Enter'); await p.waitForTimeout(420);
}

/** Is the tab reachable at all, on the strip or by searching for it. */
async function hasTab(p, name) {
  if (await strip(p, name).count()) return true;
  await p.keyboard.press('Meta+k'); await p.waitForTimeout(280);
  await p.keyboard.type(name); await p.waitForTimeout(320);
  const n = await p.locator(`.palette-row:has-text("${name}")`).count();
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  return n > 0;
}

/** Open a record row by its visible name, and wait for the sheet. */
async function openRec(p, name) {
  await p.click(`.rec:has-text("${name}")`);
  await p.waitForTimeout(350);
}

const closeSheet = async (p) => { await p.click('.sheetx'); await p.waitForTimeout(250); };

module.exports = { tab, hasTab, palette, openRec, closeSheet };

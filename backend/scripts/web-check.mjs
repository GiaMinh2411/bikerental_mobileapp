import { chromium } from "playwright";
import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve("../mobile/dist");
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const file = path.resolve(
      root,
      "." + (name === "/" ? "/index.html" : name),
    );
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error();
    const data = await fs.readFile(file);
    const types = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".png": "image/png",
      ".webp": "image/webp",
      ".ttf": "font/ttf",
    };
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] ?? "application/octet-stream",
    );
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((r) => server.listen(8081, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--disable-gpu"],
});
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8081");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page
    .getByRole("button", { name: "Tìm xe đạp", exact: true })
    .waitFor({ timeout: 30000 });
  const headingHeight = await page
    .getByText(/Một chiếc xe/)
    .evaluate((e) => e.getBoundingClientRect().height);
  assert.ok(
    headingHeight < 200,
    "Hero heading must not expand from incorrect line-height units",
  );
  await fs.mkdir("../docs/screenshots", { recursive: true });
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `../docs/screenshots/home-${width}.png` });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    assert.equal(overflow, false, `overflow at ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Tìm xe đạp", exact: true }).click();
  await page
    .getByRole("button", { name: /Xem xe / })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Chọn giờ thuê", exact: true })
    .waitFor();
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `../docs/screenshots/detail-${width}.png` });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
    );
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .getByRole("button", { name: "Chọn giờ thuê", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Kiểm tra lịch và giá", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xem xác nhận đặt thuê", exact: true })
    .waitFor();
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `../docs/screenshots/booking-${width}.png` });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
    );
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .getByRole("button", { name: "Xem xác nhận đặt thuê", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận đặt xe mô phỏng", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nhận xe mô phỏng", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Trả xe và thanh toán mô phỏng", exact: true })
    .click();
  await page.getByText("Đã thanh toán mô phỏng", { exact: true }).waitFor();
  await page.goto("http://localhost:8081");
  await page
    .getByRole("button", { name: "Nhờ AI chọn xe", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tìm xe phù hợp", exact: true })
    .click();
  await page.getByText("Gợi ý theo bộ lọc", { exact: true }).waitFor();
  await page.goto("http://localhost:8081");
  await page.getByText("Trạm xe", { exact: true }).click();
  await page
    .getByRole("button", { name: "Xem trạm và xe", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Lọc xe tại trạm này", exact: true })
    .waitFor();
  await page.goto("http://localhost:8081");
  await page.getByText("Yêu thích", { exact: true }).click();
  await page
    .getByRole("button", { name: /Xem xe / })
    .first()
    .waitFor();
  await page.getByText("Tài khoản", { exact: true }).click();
  await page.getByLabel("Họ tên", { exact: true }).fill("Người dùng demo 1");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await page.getByText("Đã lưu hồ sơ.", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Cài đặt và thông tin", exact: true })
    .click();
  await page.getByText("Bike Rental · 1.0.0", { exact: true }).waitFor();
  await page.goto("http://localhost:8081");
  await page.getByText("Tài khoản", { exact: true }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: Web login, catalog, detail, quote, booking, pickup, return, advice fallback, station detail, favorites, profile, settings and logout; three representative screens at 1440/1024/768/390/320; no page errors.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}

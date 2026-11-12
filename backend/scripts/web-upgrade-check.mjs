import { chromium } from "playwright";
import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve("../mobile/dist-review");
const server = createServer(async (req, res) => {
  try {
    const file = path.resolve(
      root,
      "." + (req.url === "/" ? "/index.html" : req.url.split("?")[0]),
    );
    if (!file.startsWith(root + path.sep)) throw Error();
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".webp": "image/webp",
        ".ttf": "font/ttf",
      }[path.extname(file)] ?? "application/octet-stream",
    );
    res.end(await fs.readFile(file));
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((r) => server.listen(8181, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ??
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const errors = [],
  missing = [];
await fs.mkdir("../docs/screenshots-upgrade", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("/media/") && r.status() >= 400) missing.push(r.url());
  });
  await page.goto("http://localhost:8181");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page
    .getByRole("button", { name: "Tìm xe còn lịch", exact: true })
    .waitFor({ timeout: 30000 });
  for (const width of [1440, 1024, 768, 390, 320, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 1000 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `../docs/screenshots-upgrade/home-${width}.png`,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      `Home overflow ${width}`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Xem tất cả xe", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Xem xe / })
    .first()
    .waitFor();
  await page.screenshot({
    path: "../docs/screenshots-upgrade/catalog-1440.png",
  });
  await page
    .getByRole("button", { name: /Xem xe / })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Chọn giờ thuê", exact: true })
    .waitFor();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `../docs/screenshots-upgrade/detail-${width}.png`,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      `Detail overflow ${width}`,
    );
  }
  await page
    .getByRole("button", { name: "Chọn giờ thuê", exact: true })
    .click();
  await page.getByRole("button", { name: "Thuê 2 giờ", exact: true }).click();
  await page
    .getByLabel("Mã giảm giá (không bắt buộc)", { exact: true })
    .fill("DEMO10");
  await page
    .getByRole("button", { name: "Kiểm tra lịch và giá", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xem xác nhận đặt thuê", exact: true })
    .waitFor();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `../docs/screenshots-upgrade/booking-${width}.png`,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      `Booking overflow ${width}`,
    );
  }
  await page
    .getByRole("button", { name: "Xem xác nhận đặt thuê", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận đặt xe mô phỏng", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nhận xe mô phỏng", exact: true })
    .click();
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.screenshot({ path: "../docs/screenshots-upgrade/rental-320.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
    "Rental overflow320",
  );
  await page
    .getByRole("button", { name: "Xem phí gia hạn", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận gia hạn", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Trả xe và thanh toán mô phỏng", exact: true })
    .click();
  await page
    .getByLabel("Nội dung đánh giá (5–1000 ký tự)", { exact: true })
    .fill("Chuyến đi kiểm thử, luồng thuê và hóa đơn rõ ràng.");
  await page.getByRole("button", { name: "Gửi đánh giá", exact: true }).click();
  await page
    .getByRole("button", { name: "Cập nhật đánh giá", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Báo sự cố hoặc yêu cầu hỗ trợ", exact: true })
    .click();
  await page
    .getByLabel("Mô tả vấn đề (10–2000 ký tự)", { exact: true })
    .fill("Nhờ hỗ trợ giải thích hóa đơn của chuyến đi kiểm thử.");
  await page
    .getByRole("button", { name: "Gửi yêu cầu hỗ trợ", exact: true })
    .click();
  await page.getByText("Đã gửi yêu cầu.", { exact: true }).waitFor();
  await page.goto("http://localhost:8181");
  await page.getByRole("button", { name: "Mở thông báo", exact: true }).click();
  await page
    .getByRole("button", { name: "Mở chuyến đi", exact: true })
    .first()
    .waitFor();
  await page.goto("http://localhost:8181");
  await page.getByText("Tài khoản", { exact: true }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("admin@bike.example");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByText("Tài khoản", { exact: true }).click();
  await page
    .getByRole("button", { name: "Quản trị đội xe", exact: true })
    .click();
  await page.getByText("Điều hành đội xe", { exact: true }).waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "../docs/screenshots-upgrade/admin-1440.png" });
  await page.getByRole("button", { name: "Chiếc xe", exact: true }).click();
  await page.getByRole("button", { name: "Hỗ trợ", exact: true }).click();
  await page
    .getByRole("button", { name: "Sửa bản ghi", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Trạng thái (OPEN / IN_PROGRESS / RESOLVED)", { exact: true })
    .fill("RESOLVED");
  await page
    .getByLabel("Nội dung phản hồi", { exact: true })
    .fill("Đã kiểm tra và giải thích hóa đơn mô phỏng.");
  await page
    .getByRole("button", { name: "Lưu thay đổi quản trị", exact: true })
    .click();
  await page.getByText("Đã lưu thay đổi.", { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(missing, []);
  console.log(
    "PASS: upgraded UI, coupon booking, pickup, extension, return, review, support, notifications and admin response; responsive screenshots; no page errors or missing media.",
  );
} catch (e) {
  console.error({ errors, missing });
  throw e;
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}

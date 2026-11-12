-- CreateTable
CREATE TABLE "reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rental_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bike_model_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reviews_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_bike_model_id_fkey" FOREIGN KEY ("bike_model_id") REFERENCES "bike_models" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "max_discount" INTEGER NOT NULL,
    "min_subtotal" INTEGER NOT NULL,
    "starts_at" DATETIME NOT NULL,
    "ends_at" DATETIME NOT NULL,
    "max_uses" INTEGER NOT NULL,
    "per_user_limit" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_demo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coupon_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rental_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "coupon_redemptions_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rental_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rental_id" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rental_events_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rental_actions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rental_id" INTEGER NOT NULL,
    "request_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    CONSTRAINT "rental_actions_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "rental_id" INTEGER,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifications_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "rental_id" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "response" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "support_tickets_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bike_models" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specifications" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "min_price" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "bike_models_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "bike_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bike_models" ("brand", "description", "id", "name", "specifications", "type_id") SELECT "brand", "description", "id", "name", "specifications", "type_id" FROM "bike_models";
DROP TABLE "bike_models";
ALTER TABLE "new_bike_models" RENAME TO "bike_models";
CREATE INDEX "bike_models_type_id_idx" ON "bike_models"("type_id");
CREATE TABLE "new_bike_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_bike_types" ("description", "id", "name") SELECT "description", "id", "name" FROM "bike_types";
DROP TABLE "bike_types";
ALTER TABLE "new_bike_types" RENAME TO "bike_types";
CREATE UNIQUE INDEX "bike_types_name_key" ON "bike_types"("name");
CREATE TABLE "new_rentals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "bike_id" INTEGER NOT NULL,
    "pickup_station_id" INTEGER NOT NULL,
    "return_station_id" INTEGER,
    "planned_start_at" DATETIME NOT NULL,
    "planned_end_at" DATETIME NOT NULL,
    "actual_start_at" DATETIME,
    "actual_end_at" DATETIME,
    "hourly_rate" INTEGER NOT NULL,
    "estimated_total" INTEGER NOT NULL,
    "final_total" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "payment_status" TEXT NOT NULL DEFAULT 'SIMULATED_PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "request_key" TEXT,
    "request_hash" TEXT,
    "policy_version" TEXT NOT NULL DEFAULT 'v1-hourly',
    "estimated_subtotal" INTEGER NOT NULL DEFAULT 0,
    "estimated_discount" INTEGER NOT NULL DEFAULT 0,
    "final_subtotal" INTEGER,
    "final_discount" INTEGER,
    "discount_type" TEXT NOT NULL DEFAULT 'NONE',
    "discount_value" INTEGER NOT NULL DEFAULT 0,
    "discount_cap" INTEGER NOT NULL DEFAULT 0,
    "coupon_id" INTEGER,
    "coupon_code" TEXT,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "rentals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rentals_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "bikes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rentals_pickup_station_id_fkey" FOREIGN KEY ("pickup_station_id") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rentals_return_station_id_fkey" FOREIGN KEY ("return_station_id") REFERENCES "stations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rentals_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rentals" ("actual_end_at", "actual_start_at", "bike_id", "created_at", "estimated_total", "final_total", "hourly_rate", "id", "payment_status", "pickup_station_id", "planned_end_at", "planned_start_at", "return_station_id", "status", "updated_at", "user_id") SELECT "actual_end_at", "actual_start_at", "bike_id", "created_at", "estimated_total", "final_total", "hourly_rate", "id", "payment_status", "pickup_station_id", "planned_end_at", "planned_start_at", "return_station_id", "status", "updated_at", "user_id" FROM "rentals";
DROP TABLE "rentals";
ALTER TABLE "new_rentals" RENAME TO "rentals";
CREATE INDEX "rentals_bike_id_status_planned_start_at_planned_end_at_idx" ON "rentals"("bike_id", "status", "planned_start_at", "planned_end_at");
CREATE INDEX "rentals_user_id_created_at_idx" ON "rentals"("user_id", "created_at");
CREATE UNIQUE INDEX "rentals_user_id_request_key_key" ON "rentals"("user_id", "request_key");
CREATE TABLE "new_stations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "image_path" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_stations" ("address", "created_at", "id", "image_path", "latitude", "longitude", "name") SELECT "address", "created_at", "id", "image_path", "latitude", "longitude", "name" FROM "stations";
DROP TABLE "stations";
ALTER TABLE "new_stations" RENAME TO "stations";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "email", "full_name", "id", "password_hash", "phone", "updated_at") SELECT "created_at", "email", "full_name", "id", "password_hash", "phone", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "reviews_rental_id_key" ON "reviews"("rental_id");

-- CreateIndex
CREATE INDEX "reviews_bike_model_id_created_at_id_idx" ON "reviews"("bike_model_id", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_rental_id_key" ON "coupon_redemptions"("rental_id");

-- CreateIndex
CREATE INDEX "coupon_redemptions_coupon_id_status_user_id_idx" ON "coupon_redemptions"("coupon_id", "status", "user_id");

-- CreateIndex
CREATE INDEX "rental_events_rental_id_created_at_id_idx" ON "rental_events"("rental_id", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_actions_rental_id_request_key_key" ON "rental_actions"("rental_id", "request_key");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_id_idx" ON "notifications"("user_id", "read_at", "created_at", "id");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_created_at_id_idx" ON "support_tickets"("user_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "support_tickets_status_created_at_id_idx" ON "support_tickets"("status", "created_at", "id");

UPDATE rentals SET estimated_subtotal=estimated_total, final_subtotal=final_total;
UPDATE bike_models SET min_price=COALESCE((SELECT MIN(price_per_hour) FROM bikes WHERE bikes.bike_model_id=bike_models.id),0);
CREATE INDEX "bike_models_active_min_price_id" ON "bike_models"("active","min_price","id");

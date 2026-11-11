-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "stations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "image_path" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bike_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "bike_models" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specifications" TEXT NOT NULL,
    CONSTRAINT "bike_models_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "bike_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bike_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bike_model_id" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "bike_images_bike_model_id_fkey" FOREIGN KEY ("bike_model_id") REFERENCES "bike_models" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bikes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "bike_model_id" INTEGER NOT NULL,
    "station_id" INTEGER NOT NULL,
    "price_per_hour" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bikes_bike_model_id_fkey" FOREIGN KEY ("bike_model_id") REFERENCES "bike_models" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bikes_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rentals" (
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
    CONSTRAINT "rentals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rentals_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "bikes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rentals_pickup_station_id_fkey" FOREIGN KEY ("pickup_station_id") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rentals_return_station_id_fkey" FOREIGN KEY ("return_station_id") REFERENCES "stations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" INTEGER NOT NULL,
    "bike_model_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "bike_model_id"),
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "favorites_bike_model_id_fkey" FOREIGN KEY ("bike_model_id") REFERENCES "bike_models" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bike_types_name_key" ON "bike_types"("name");

-- CreateIndex
CREATE INDEX "bike_models_type_id_idx" ON "bike_models"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "bike_images_bike_model_id_sort_order_key" ON "bike_images"("bike_model_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "bikes_code_key" ON "bikes"("code");

-- CreateIndex
CREATE INDEX "bikes_bike_model_id_station_id_status_idx" ON "bikes"("bike_model_id", "station_id", "status");

-- CreateIndex
CREATE INDEX "rentals_bike_id_status_planned_start_at_planned_end_at_idx" ON "rentals"("bike_id", "status", "planned_start_at", "planned_end_at");

-- CreateIndex
CREATE INDEX "rentals_user_id_created_at_idx" ON "rentals"("user_id", "created_at");

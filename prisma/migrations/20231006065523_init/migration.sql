-- CreateTable
CREATE TABLE `major` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `college` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `major_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `major_id` VARCHAR(191) NOT NULL,
    `enroll_year` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `class_id_key`(`id`),
    UNIQUE INDEX `class_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stu_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sex` INTEGER NOT NULL,
    `id_card` VARCHAR(191) NOT NULL,
    `type` INTEGER NOT NULL,
    `class_id` VARCHAR(191) NOT NULL,
    `isDelay` BOOLEAN NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_stu_id_key`(`stu_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher` (
    `id` INTEGER NOT NULL,
    `teacher_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `teacher_id_key`(`id`),
    UNIQUE INDEX `teacher_teacher_id_key`(`teacher_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `user_name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `account_user_name_key`(`user_name`),
    PRIMARY KEY (`user_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `term_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `academic_start` INTEGER NOT NULL,
    `academic_end` INTEGER NOT NULL,
    `semester` INTEGER NOT NULL,
    `exhibit_stage_start` DATETIME(3) NOT NULL,
    `exhibit_stage_end` DATETIME(3) NOT NULL,
    `first_stage_start` DATETIME(3) NOT NULL,
    `first_stage_end` DATETIME(3) NOT NULL,
    `second_stage_start` DATETIME(3) NOT NULL,
    `second_stage_end` DATETIME(3) NOT NULL,
    `third_stage_start` DATETIME(3) NOT NULL,
    `third_stage_end` DATETIME(3) NOT NULL,
    `status` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NOT NULL,
    `week_num` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL,
    `hour` INTEGER NOT NULL,
    `prop` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `course_time` VARCHAR(191) NOT NULL,
    `targetNum` VARCHAR(191) NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `term_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_major_limit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `major_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stage_grade_limit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stage` INTEGER NOT NULL,
    `grad_limit` INTEGER NOT NULL,
    `course_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `star_record` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `term_id` INTEGER NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `selection_record` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `term_id` INTEGER NOT NULL,
    `will_num` INTEGER NOT NULL,
    `case` VARCHAR(191) NOT NULL,
    `status` INTEGER NOT NULL,
    `stage` INTEGER NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announce` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `click_num` INTEGER NOT NULL,
    `status` INTEGER NOT NULL,
    `publish_time` DATETIME(3) NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL,
    `sender_user_id` VARCHAR(191) NOT NULL,
    `target_user_id` VARCHAR(191) NOT NULL,
    `is_read` INTEGER NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_major_id_fkey` FOREIGN KEY (`major_id`) REFERENCES `major`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_stu_id_fkey` FOREIGN KEY (`stu_id`) REFERENCES `account`(`user_name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher` ADD CONSTRAINT `teacher_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `account`(`user_name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin` ADD CONSTRAINT `admin_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `account`(`user_name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course` ADD CONSTRAINT `course_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `term_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_major_limit` ADD CONSTRAINT `course_major_limit_major_id_fkey` FOREIGN KEY (`major_id`) REFERENCES `major`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_major_limit` ADD CONSTRAINT `course_major_limit_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stage_grade_limit` ADD CONSTRAINT `stage_grade_limit_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `star_record` ADD CONSTRAINT `star_record_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `star_record` ADD CONSTRAINT `star_record_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `term_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `star_record` ADD CONSTRAINT `star_record_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `selection_record` ADD CONSTRAINT `selection_record_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `selection_record` ADD CONSTRAINT `selection_record_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `term_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `selection_record` ADD CONSTRAINT `selection_record_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_sender_user_id_fkey` FOREIGN KEY (`sender_user_id`) REFERENCES `account`(`user_name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `account`(`user_name`) ON DELETE RESTRICT ON UPDATE CASCADE;

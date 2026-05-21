ALTER TABLE `Academy`
  ADD COLUMN `showStatCounters` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `statCounters` TEXT NULL,
  ADD COLUMN `showTestimonials` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `testimonials` TEXT NULL;

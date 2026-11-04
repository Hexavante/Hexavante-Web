CREATE TABLE instructor_exam_submissions (
  exam_id VARCHAR(191) NOT NULL,
  author_id VARCHAR(191) NOT NULL,
  submitted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (exam_id),
  INDEX instructor_exam_submissions_author_id_idx (author_id),
  CONSTRAINT instructor_exam_submissions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

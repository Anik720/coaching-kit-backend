export interface IStudentResult {
  studentId: string;
  registrationId: string;
  name: string;
  marks: number;
  percentage: number;
  grade?: string;
  gpa?: number;
  isPassed: boolean;
  isAbsent: boolean;
  position?: number;
}

export interface IBulkResultResponse {
  successCount: number;
  failedCount: number;
  errors: Array<{
    studentId: string;
    error: string;
  }>;
  results: any[];
}

export interface IResultSummary {
  examId: string;
  examName: string;
  className: string;
  batchName: string;
  subjectName: string;
  totalStudents: number;
  presentStudents: number;
  passedStudents: number;
  failedStudents: number;
  absentStudents: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  topPerformers: IStudentResult[];
}

export interface IResultStats {
  totalResults: number;
  passedCount: number;
  failedCount: number;
  absentCount: number;
  averagePercentage: number;
  highestMarks: number;
  lowestMarks: number;
  gradeDistribution: Record<string, number>;
}
// Sample roster — shaped to match the JUMJ admin console's student schema
// (uid, name, gender, department, batch, subjectIds, attendanceRate, enrollments…)
// so this page can be pointed at the real Firestore data with no shape changes.

export const SUBJECTS = [
  { slug: 'riyadu-ssalihin', name: "Riyad us-Saliheen" },
  { slug: 'tafsir', name: 'Tafsir al-Qur’an' },
  { slug: 'fiqh-ibadat', name: "Fiqh al-'Ibadat" },
  { slug: 'aqeedah', name: "'Aqeedah" },
  { slug: 'seerah', name: 'Seerah' },
  { slug: 'usul-fiqh', name: 'Usul al-Fiqh' },
  { slug: 'arabic', name: 'Arabic Grammar' },
];

const subjectSet = (...slugs) => slugs;

export const STUDENTS = [
  { uid: 'u01', name: 'Amina Yusuf', gender: 'F', department: 'Medicine', batch: '2023', phone: '0911 22 33 44', email: 'amina.yusuf@ju.edu.et', idConfirmed: true, attendanceRate: 96, subjectIds: subjectSet('riyadu-ssalihin', 'tafsir', 'aqeedah') },
  { uid: 'u02', name: 'Bilal Ahmed', gender: 'M', department: 'Engineering', batch: '2022', phone: '0922 33 44 55', email: 'bilal.ahmed@ju.edu.et', idConfirmed: true, attendanceRate: 88, subjectIds: subjectSet('riyadu-ssalihin', 'fiqh-ibadat') },
  { uid: 'u03', name: 'Zeinab Kedir', gender: 'F', department: 'Pharmacy', batch: '2024', phone: '0933 44 55 66', email: 'zeinab.kedir@ju.edu.et', idConfirmed: false, attendanceRate: 73, subjectIds: subjectSet('tafsir', 'seerah', 'arabic') },
  { uid: 'u04', name: 'Hamza Ibrahim', gender: 'M', department: 'Law', batch: '2023', phone: '0944 55 66 77', email: 'hamza.ibrahim@ju.edu.et', idConfirmed: true, attendanceRate: 91, subjectIds: subjectSet('usul-fiqh', 'fiqh-ibadat', 'aqeedah') },
  { uid: 'u05', name: 'Ruqiya Seid', gender: 'F', department: 'Public Health', batch: '2022', phone: '0955 66 77 88', email: 'ruqiya.seid@ju.edu.et', idConfirmed: true, attendanceRate: 64, subjectIds: subjectSet('riyadu-ssalihin', 'arabic') },
  { uid: 'u06', name: 'Yusuf Mohammed', gender: 'M', department: 'Business', batch: '2024', phone: '0966 77 88 99', email: 'yusuf.mohammed@ju.edu.et', idConfirmed: true, attendanceRate: 82, subjectIds: subjectSet('tafsir', 'seerah') },
  { uid: 'u07', name: 'Halima Nasir', gender: 'F', department: 'Medicine', batch: '2024', phone: '0911 55 22 10', email: 'halima.nasir@ju.edu.et', idConfirmed: false, attendanceRate: 100, subjectIds: subjectSet('riyadu-ssalihin', 'tafsir', 'aqeedah', 'usul-fiqh') },
  { uid: 'u08', name: 'Abdulkadir Jemal', gender: 'M', department: 'Natural Science', batch: '2023', phone: '0922 10 44 78', email: 'abdulkadir.jemal@ju.edu.et', idConfirmed: true, attendanceRate: 58, subjectIds: subjectSet('fiqh-ibadat') },
  { uid: 'u09', name: 'Sumeya Ali', gender: 'F', department: 'Law', batch: '2022', phone: '0933 88 12 60', email: 'sumeya.ali@ju.edu.et', idConfirmed: true, attendanceRate: 94, subjectIds: subjectSet('usul-fiqh', 'arabic', 'seerah') },
  { uid: 'u10', name: 'Ismail Tahir', gender: 'M', department: 'Engineering', batch: '2024', phone: '0944 21 33 09', email: 'ismail.tahir@ju.edu.et', idConfirmed: false, attendanceRate: 77, subjectIds: subjectSet('riyadu-ssalihin', 'fiqh-ibadat') },
  { uid: 'u11', name: 'Nasra Hussein', gender: 'F', department: 'Pharmacy', batch: '2023', phone: '0955 40 19 82', email: 'nasra.hussein@ju.edu.et', idConfirmed: true, attendanceRate: 85, subjectIds: subjectSet('tafsir', 'aqeedah') },
  { uid: 'u12', name: 'Mustafa Endris', gender: 'M', department: 'Business', batch: '2022', phone: '0966 15 60 33', email: 'mustafa.endris@ju.edu.et', idConfirmed: true, attendanceRate: 69, subjectIds: subjectSet('seerah', 'arabic', 'usul-fiqh') },
  { uid: 'u13', name: 'Khadija Reshid', gender: 'F', department: 'Public Health', batch: '2024', phone: '0911 77 05 24', email: 'khadija.reshid@ju.edu.et', idConfirmed: true, attendanceRate: 90, subjectIds: subjectSet('riyadu-ssalihin', 'tafsir') },
  { uid: 'u14', name: 'Ahmed Nuru', gender: 'M', department: 'Medicine', batch: '2022', phone: '0922 88 39 11', email: 'ahmed.nuru@ju.edu.et', idConfirmed: false, attendanceRate: 48, subjectIds: subjectSet('fiqh-ibadat', 'aqeedah') },
  { uid: 'u15', name: 'Fatima Shemsu', gender: 'F', department: 'Natural Science', batch: '2023', phone: '0933 62 90 47', email: 'fatima.shemsu@ju.edu.et', idConfirmed: true, attendanceRate: 97, subjectIds: subjectSet('usul-fiqh', 'seerah', 'arabic', 'tafsir') },
  { uid: 'u16', name: 'Omar Abduro', gender: 'M', department: 'Law', batch: '2024', phone: '0944 03 71 58', email: 'omar.abduro@ju.edu.et', idConfirmed: true, attendanceRate: 81, subjectIds: subjectSet('riyadu-ssalihin', 'usul-fiqh') },
];

export function subjectNames(ids) {
  return ids
    .map((id) => SUBJECTS.find((s) => s.slug === id)?.name)
    .filter(Boolean);
}

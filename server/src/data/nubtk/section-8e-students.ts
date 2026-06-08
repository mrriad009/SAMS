export interface Section8EStudent {
  name: string;
  studentId: string;
}

export const SECTION_8E_STUDENTS: Section8EStudent[] = [
  { name: 'Md. Rohit Hasan', studentId: '11220321018' },
  { name: 'Mst. Suraia Akter', studentId: '11220320951' },
  { name: 'Fahima Jahah Rinti', studentId: '11220321025' },
  { name: 'Md. Mahatab Hossain', studentId: '11220320997' },
  { name: 'Aiman Al Mahmud', studentId: '11220321001' },
  { name: 'Gazi Enamul Haque Ratul', studentId: '11220321008' },
  { name: 'Aishwariya Roy', studentId: '11220321021' },
  { name: 'Jasia Hasan Mumun', studentId: '11220321000' },
  { name: 'Hafsa Hasan Mim', studentId: '11220321029' },
  { name: 'Jahanara Sultana Nipa', studentId: '11220120761' },
  { name: 'Md Mahamudul Islam Riad', studentId: '11220320898' },
  { name: 'Al Mamun Shaikh', studentId: '11220321011' },
  { name: 'Aiysha Busra Alam', studentId: '11210320622' },
  { name: 'Md. Muzahidur Rahman', studentId: '11220120780' },
  { name: 'Kazi Ismat Zerin', studentId: '11220321014' },
  { name: 'Souravi Sultana Sumi', studentId: '11220321023' },
  { name: 'Suraya Khatun Hasiba', studentId: '11220321003' },
  { name: 'Subarna Roy', studentId: '11220320989' },
  { name: 'SK. Yeasin Ahsanullah Al-Galib', studentId: '11220320941' },
  { name: 'Anika Tahmin', studentId: '11220320991' },
  { name: 'Laboni Sarkar', studentId: '11220321012' },
  { name: 'Mehnaz Ahmmed', studentId: '11220321017' },
  { name: 'Marzia Sultana Mim', studentId: '11210320652' },
  { name: 'Rajoanul Islam', studentId: '11220321009' },
  { name: 'Pushpita Banik', studentId: '11220321045' },
  { name: 'Najmul Sakib', studentId: '11220321002' },
];

/** Demo login shortcut on the sign-in page */
export const DEMO_STUDENT_ID = '11220321018';

/** Student login email: `{studentId}@gmail.com` */
export function section8EEmail(studentId: string): string {
  return `${studentId.trim()}@gmail.com`;
}

/** Student login password equals their student ID */
export function section8EPassword(studentId: string): string {
  return studentId.trim();
}

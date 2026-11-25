export type UserRole = 'ADMIN' | 'STAFF';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface DashboardStats {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
  activeBookings: number;
  totalCollected: string;
}

export interface BedItem {
  id: number;
  roomId: number;
  bedLabel: string;
  status: BedStatus;
  roomNumber: string;
  roomTypeName: string;
  pricePerNight: string;
}

export interface GuestItem {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  idNumber: string;
  emergencyContact?: string;
}

export interface BookingItem {
  id: number;
  guestId: number;
  bedId: number;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  guestName: string;
  bedLabel: string;
  roomNumber: string;
}

export interface InvoiceItem {
  id: number;
  bookingId: number;
  roomCharges: string;
  serviceCharges: string;
  totalAmount: string;
  paidAmount: string;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  guestName: string;
  roomNumber: string;
  bedLabel: string;
}

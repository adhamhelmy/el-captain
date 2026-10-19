import { Redirect } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { homeFor } from '@/auth/home';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={homeFor(user)} />;
}

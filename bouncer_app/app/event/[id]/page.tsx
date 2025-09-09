'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { createClient } from '@/lib/supabase-browser-client';
import { DataTable } from '@/components/data-table';
import { createColumns } from './columns';
import { Button } from '@/components/ui/button';
import { format, toZonedTime } from 'date-fns-tz';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  QrCodeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Scanner from '@/components/scanner';
import PaymentProofModal from '@/components/payment-proof-modal';
import EmailModal from '@/components/email-modal';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  isAuthorized?: boolean;
}

export default function EventDetails() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    isAuthorized: undefined,
  });
  const [event, setEvent] = useState<
    Database['public']['Tables']['Events']['Row'] | null
  >(null);
  const [rsvps, setRsvps] = useState<
    Database['public']['Tables']['rsvps']['Row'][]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zelleData, setZelleData] = useState<
    Array<{ name: string; amount: number }>
  >([]);
  const [venmoData, setVenmoData] = useState<
    Array<{ name: string; amount: number }>
  >([]);
  const [processingPayments, setProcessingPayments] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [guests, setGuests] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<
    'Verified' | 'Not Found' | null
  >(null);
  const [paymentProofModal, setPaymentProofModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    guestName: string;
  }>({
    isOpen: false,
    imageUrl: '',
    guestName: '',
  });
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

  // Check for Gmail connection success
  useEffect(() => {
    if (searchParams.get('gmail_connected') === 'true') {
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className =
        'fixed top-4 right-4 bg-green-800/90 text-green-100 px-6 py-3 rounded-lg shadow-lg z-50 border border-green-600/50';
      successMessage.textContent = 'Gmail connected successfully! You can now send emails automatically.';
      document.body.appendChild(successMessage);

      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 4000);
    }
  }, []);

  // Simple session check - like a backend getSession endpoint
  const checkSession = useCallback(async () => {
    try {
      console.log('🔍 Checking session...');
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        // If it's a refresh token error, sign out to clear invalid tokens
        if (
          error.message?.includes('refresh') ||
          error.message?.includes('Invalid')
        ) {
          console.log('🔄 Clearing invalid session...');
          await supabase.auth.signOut();
        }
        return { isAuthenticated: false, user: null };
      }

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        return { isAuthenticated: true, user: session.user };
      } else {
        console.log('❌ No session found');
        return { isAuthenticated: false, user: null };
      }
    } catch (err) {
      console.error('Session check failed:', err);
      return { isAuthenticated: false, user: null };
    }
  }, [supabase.auth]);

  const fetchEventDetails = useCallback(
    async (user: User) => {
      if (!eventId) {
        setError('No event ID provided');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('Events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching event details:', error);
          setError(error.message);
          setEvent(null);
          return null;
        }

        if (data) {
          setEvent(data);
          setError(null);

          // Check if user is the event owner
          const isOwner = user.id === data.user_id;
          console.log('🔐 Authorization check:', {
            isOwner,
            userId: user.id,
            eventOwnerId: data.user_id,
            userEmail: user.email,
            eventName: data.name,
          });

          return { event: data, isOwner };
        } else {
          setError(
            'Event not found. The event may have been deleted or the link is invalid.'
          );
          setEvent(null);
          return null;
        }
      } catch (err) {
        console.error('Unexpected error fetching event:', err);
        setError('Failed to load event details');
        setEvent(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, eventId]
  );

  const fetchRsvps = useCallback(async () => {
    if (!eventId) {
      setRsvps([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*, tickets (name, price)')
        .eq('event_id', eventId);

      if (error) {
        console.error('Error fetching RSVPs:', error);
        setError(error.message);
        setRsvps([]);
      } else if (data) {
        // Transform the data to include ticket_name and ticket_price
        const transformedData = data.map(rsvp => ({
          ...rsvp,
          ticket_name: rsvp.tickets?.name || 'Unknown',
          ticket_price: rsvp.tickets?.price || 0,
        }));
        setRsvps(transformedData);
        // Extract user_ids for QR verification
        setGuests(data.map(rsvp => rsvp.user_id));
      } else {
        setRsvps([]);
        setGuests([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching RSVPs:', err);
      setRsvps([]);
      setGuests([]);
    }
  }, [supabase, eventId]);

  // QR Scanner handlers
  const handleScanSuccess = (decodedText: string) => {
    if (!verificationStatus) {
      setScanResult(decodedText);
    }
  };

  const handleScanFailure = (error: any) => {
    if (typeof error === 'string' && error.includes('No QR code found')) {
      return;
    }
    console.warn(`QR code scan error:`, error);
  };

  // Handle scan result verification
  useEffect(() => {
    if (scanResult) {
      if (guests.includes(scanResult)) {
        setVerificationStatus('Verified');
      } else {
        setVerificationStatus('Not Found');
      }

      const timer = setTimeout(() => {
        setScanResult(null);
        setVerificationStatus(null);
      }, 3000); // 3-second delay

      return () => clearTimeout(timer);
    }
  }, [scanResult, guests]);

  // Main authentication effect - simple session endpoint approach
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication on page load/refresh');

      // Step 1: Check session (like calling backend getSession endpoint)
      const sessionResult = await checkSession();

      if (!sessionResult.isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login');
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false,
          isAuthorized: false,
        });
        router.replace(
          `/api/auth/direct-google?next=${encodeURIComponent(`/event/${eventId}`)}`
        );
        return;
      }

      // Step 2: User is authenticated, now check event authorization
      console.log('✅ User is authenticated, checking event authorization');
      setAuth(prev => ({
        ...prev,
        isAuthenticated: true,
        user: sessionResult.user,
        loading: true, // Still loading while checking authorization
      }));

      const eventResult = await fetchEventDetails(sessionResult.user!);

      if (!eventResult) {
        // Event not found or error occurred
        setAuth(prev => ({
          ...prev,
          loading: false,
          isAuthorized: false,
        }));
        return;
      }

      if (eventResult.isOwner) {
        console.log('✅ User is authorized as event owner');
        setAuth(prev => ({
          ...prev,
          loading: false,
          isAuthorized: true,
        }));
        // Fetch RSVPs
        fetchRsvps();
      } else {
        console.log('❌ User is not the event owner');
        setAuth(prev => ({
          ...prev,
          loading: false,
          isAuthorized: false,
        }));
        setError(
          'You are not authorized to view this event page. Only the event creator can access this page.'
        );
      }
    };

    // Set up auth state listener for future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);

      if (event === 'SIGNED_OUT') {
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false,
          isAuthorized: false,
        });
        router.replace('/login');
      } else if (event === 'SIGNED_IN' && session) {
        // Re-run the full initialization
        initializeAuth();
      }
    });

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [
    checkSession,
    fetchEventDetails,
    fetchRsvps,
    router,
    eventId,
    supabase.auth,
  ]);

  const handleShare = (eventId: string) => {
    if (typeof window !== 'undefined') {
      const inviteLink = `${window.location.origin}/rsvp?event_id=${eventId}`;
      navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
    }
  };

  const handleEdit = () => {
    router.push(`/create-event?event_id=${eventId}`);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
      )
    ) {
      // First, delete all RSVPs associated with the event
      const { error: rsvpError } = await supabase
        .from('rsvps')
        .delete()
        .eq('event_id', eventId);

      if (rsvpError) {
        console.error('Error deleting RSVPs:', rsvpError);
        setError(rsvpError.message);
        return;
      }

      // Then, delete the event itself
      const { error: eventError } = await supabase
        .from('Events')
        .delete()
        .eq('id', eventId);

      if (eventError) {
        console.error('Error deleting event:', eventError);
        setError(eventError.message);
      } else {
        router.push('/event');
      }
    }
  };

  // Handler for amount paid changes
  const handleAmountPaidChange = useCallback(
    (rsvpId: string, amount: number) => {
      setRsvps(prevRsvps =>
        prevRsvps.map(rsvp =>
          rsvp.id === rsvpId ? { ...rsvp, amount_paid: amount } : rsvp
        )
      );
    },
    []
  );

  const handleSave = async (
    updatedRsvps: (Database['public']['Tables']['rsvps']['Row'] & {
      ticket_name?: string;
      ticket_price?: number;
      tickets?: any;
    })[]
  ) => {
    try {
      // Filter out the extra fields that don't exist in the database schema
      const cleanRsvps = updatedRsvps.map(
        ({ ticket_name, ticket_price, tickets, ...rsvp }) => rsvp
      );

      const { error } = await supabase
        .from('rsvps')
        .upsert(cleanRsvps, { onConflict: 'id' });

      if (error) {
        console.error('Error updating RSVPs:', error);
        setError(error.message);
        throw error;
      } else {
        await fetchRsvps(); // Refresh the data
        // Show success notification in a more modern way
        const successMessage = document.createElement('div');
        successMessage.className =
          'fixed top-4 right-4 bg-green-800/90 text-green-100 px-6 py-3 rounded-lg shadow-lg z-50 border border-green-600/50';
        successMessage.textContent = 'Verification changes saved successfully!';
        document.body.appendChild(successMessage);

        // Remove the notification after 3 seconds
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
      }
    } catch (error) {
      // Error is already handled above
      console.error('Save operation failed:', error);
    }
  };

  const handleViewPaymentProof = (imageUrl: string, guestName: string) => {
    setPaymentProofModal({
      isOpen: true,
      imageUrl,
      guestName,
    });
  };

  const handleClosePaymentProof = () => {
    setPaymentProofModal({
      isOpen: false,
      imageUrl: '',
      guestName: '',
    });
  };

  const handleOpenEmailModal = () => {
    setEmailModal({ isOpen: true });
  };

  const handleCloseEmailModal = () => {
    setEmailModal({ isOpen: false });
  };

  const handleSendEmails = async (recipients: string[], message: string) => {
    try {
      // Check if user has Gmail connected first
      const checkResponse = await fetch('/api/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          message,
          eventName: event?.name,
          userId: auth.user?.id,
        }),
      });

      const result = await checkResponse.json();

      // Handle mailto fallback - but ask if they want Gmail first
      if (checkResponse.ok && result.useMailto) {
        // Ask user if they want to connect Gmail for automatic sending
        const connectGmail = confirm(
          'Would you like to connect your Gmail account to send emails automatically? \n\n' +
          'Choose "OK" to connect Gmail for automatic sending, or "Cancel" to use email drafts.'
        );
        
        if (connectGmail) {
          // Get Gmail auth URL
          const authResponse = await fetch(`/api/auth/gmail?userId=${auth.user?.id}&eventId=${eventId}`);
          const authResult = await authResponse.json();
          
          if (authResponse.ok && authResult.authUrl) {
            // Open Gmail OAuth in new window
            window.open(authResult.authUrl, 'gmail-auth', 'width=500,height=600');
            
            // Show message to user
            const infoMessage = document.createElement('div');
            infoMessage.className =
              'fixed top-4 right-4 bg-blue-800/90 text-blue-100 px-6 py-3 rounded-lg shadow-lg z-50 border border-blue-600/50';
            infoMessage.textContent = 'Please complete Gmail authentication in the popup window, then try sending emails again.';
            document.body.appendChild(infoMessage);

            setTimeout(() => {
              if (document.body.contains(infoMessage)) {
                document.body.removeChild(infoMessage);
              }
            }, 6000);
            
            return; // Don't fall back to mailto, wait for user to authenticate
          } else {
            alert('Failed to get Gmail authentication URL. Falling back to email drafts.');
          }
        }
        
        // Fall back to mailto approach (either user chose Cancel or Gmail auth failed)
        const subject = encodeURIComponent(`Update from ${event?.name || 'Event'}`);
        const body = encodeURIComponent(message);
        
        recipients.forEach((email, index) => {
          setTimeout(() => {
            window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
          }, index * 100);
        });
        
        const infoMessage = document.createElement('div');
        infoMessage.className =
          'fixed top-4 right-4 bg-blue-800/90 text-blue-100 px-6 py-3 rounded-lg shadow-lg z-50 border border-blue-600/50';
        infoMessage.textContent = `Opening ${recipients.length} email drafts in your default email client.`;
        document.body.appendChild(infoMessage);

        setTimeout(() => {
          if (document.body.contains(infoMessage)) {
            document.body.removeChild(infoMessage);
          }
        }, 6000);
        
        return;
      }

      // Handle Gmail authentication required
      if (!checkResponse.ok && (checkResponse.status === 401 || checkResponse.status === 404)) {
        if (result.error.includes('authenticate with Gmail') || result.error.includes('Gmail not connected')) {
          // Show Gmail connection prompt
          const confirmConnect = confirm(
            'To send emails from your Gmail account, you need to connect Gmail first. Would you like to connect now?'
          );
          
          if (confirmConnect) {
            // Get Gmail auth URL
            const authResponse = await fetch(`/api/auth/gmail?userId=${auth.user?.id}&eventId=${eventId}`);
            const authResult = await authResponse.json();
            
            if (authResponse.ok && authResult.authUrl) {
              // Open Gmail OAuth in new window
              window.open(authResult.authUrl, 'gmail-auth', 'width=500,height=600');
              
              // Show message to user
              const infoMessage = document.createElement('div');
              infoMessage.className =
                'fixed top-4 right-4 bg-blue-800/90 text-blue-100 px-6 py-3 rounded-lg shadow-lg z-50 border border-blue-600/50';
              infoMessage.textContent = 'Please complete Gmail authentication in the popup window, then try sending emails again.';
              document.body.appendChild(infoMessage);

              setTimeout(() => {
                if (document.body.contains(infoMessage)) {
                  document.body.removeChild(infoMessage);
                }
              }, 6000);
              
              return; // Don't throw error, just return
            } else {
              throw new Error('Failed to get Gmail authentication URL');
            }
          } else {
            return; // User cancelled, don't throw error
          }
        } else {
          throw new Error(result.error || 'Failed to send emails');
        }
      } else if (!checkResponse.ok) {
        throw new Error(result.error || 'Failed to send emails');
      }

      // Show success message with details
      const { successful, failed } = result.results;
      const successMessage = document.createElement('div');
      successMessage.className =
        'fixed top-4 right-4 bg-green-800/90 text-green-100 px-6 py-3 rounded-lg shadow-lg z-50 border border-green-600/50';
      
      if (failed > 0) {
        successMessage.textContent = `Emails sent from your Gmail! ${successful} successful, ${failed} failed`;
        console.log('Email send results:', result.results.details);
      } else {
        successMessage.textContent = `Successfully sent emails from your Gmail to ${successful} recipients!`;
      }
      
      document.body.appendChild(successMessage);

      // Remove the notification after 4 seconds
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 4000);

    } catch (error) {
      console.error('Error sending emails:', error);
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className =
        'fixed top-4 right-4 bg-red-800/90 text-red-100 px-6 py-3 rounded-lg shadow-lg z-50 border border-red-600/50';
      errorMessage.textContent = `Failed to send emails: ${error instanceof Error ? error.message : 'Unknown error'}`;
      document.body.appendChild(errorMessage);

      // Remove the notification after 4 seconds
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage);
        }
      }, 4000);

      throw error; // Re-throw so the modal can handle the error state
    }
  };

  const parseZelleFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const zellePayments: Array<{ name: string; amount: number }> = [];

    // Regex pattern from KASA system: "BofA: (name) sent you $amount"
    const pattern = /BofA: (.*?) sent you \$([0-9]+\.\d{2})(?: for.*)?/i;

    for (const line of lines) {
      const trimmedLine = line.trim();
      const match = pattern.exec(trimmedLine);
      if (match) {
        const name = match[1].trim().toLowerCase().replace(/\s+/g, ' ');
        const amount = parseFloat(match[2]);
        zellePayments.push({ name, amount });
      }
    }

    setZelleData(zellePayments);
    return zellePayments;
  };

  const parseVenmoFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const venmoPayments: Array<{ name: string; amount: number }> = [];

    // Skip header rows (first 3 lines based on the CSV format)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      if (columns.length >= 9) {
        const from = columns[6]?.trim().toLowerCase().replace(/\s+/g, ' ');
        const amountStr = columns[8]?.trim().replace(/[^\d.-]/g, '');
        const amount = parseFloat(amountStr);

        // Only include incoming payments (positive amounts)
        if (from && amount > 0 && !isNaN(amount)) {
          venmoPayments.push({ name: from, amount });
        }
      }
    }

    setVenmoData(venmoPayments);
    return venmoPayments;
  };

  const crossCheckPayments = async () => {
    if (!rsvps.length) return;

    setProcessingPayments(true);
    const updatedRsvps = [
      ...rsvps,
    ] as (Database['public']['Tables']['rsvps']['Row'] & {
      tickets?: any;
      ticket_name?: string;
      ticket_price?: number;
    })[];

    for (const rsvp of updatedRsvps) {
      const rsvpName = rsvp.name.toLowerCase().trim().replace(/\s+/g, ' ');
      let totalPaid = 0;
      let paymentMethod = '';

      // Check Zelle payments
      const zelleMatches = zelleData.filter(
        payment => payment.name === rsvpName
      );
      if (zelleMatches.length > 0) {
        totalPaid += zelleMatches.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        paymentMethod = 'zelle';
      }

      // Check Venmo payments
      const venmoMatches = venmoData.filter(
        payment => payment.name === rsvpName
      );
      if (venmoMatches.length > 0) {
        totalPaid += venmoMatches.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        paymentMethod = paymentMethod ? 'multiple' : 'venmo';
      }

      // Determine payment status
      let paymentStatus = 'unpaid';
      if (totalPaid > 0) {
        // For now, mark as paid if any payment is received
        // TODO: Add expected amount logic when ticketing is implemented
        paymentStatus = totalPaid > 0 ? 'paid' : 'unpaid';
      }

      // Update RSVP with payment info
      rsvp.payment_status = paymentStatus;
      rsvp.amount_paid = totalPaid;
      rsvp.payment_method = paymentMethod;
    }

    // Filter out the extra fields that don't exist in the database schema
    const cleanRsvps = updatedRsvps.map(
      ({ tickets, ticket_name, ticket_price, ...rsvp }) => rsvp
    );

    // Update database
    const { error } = await supabase
      .from('rsvps')
      .upsert(cleanRsvps, { onConflict: 'id' });

    if (error) {
      console.error('Error updating payment status:', error);
      setError('Failed to update payment status');
    } else {
      setRsvps(updatedRsvps);
      alert('Payment verification completed!');
    }

    setProcessingPayments(false);
  };

  const handleZelleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await parseZelleFile(file);
      await crossCheckPayments();
    } catch (error) {
      console.error('Error processing Zelle file:', error);
      setError('Failed to process Zelle file');
    }
  };

  const handleVenmoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await parseVenmoFile(file);
      await crossCheckPayments();
    } catch (error) {
      console.error('Error processing Venmo file:', error);
      setError('Failed to process Venmo file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading event details...</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-500 mt-2">Fetching event data...</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-red-300 text-lg">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication or authorization
  if (auth.loading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">
            {!auth.isAuthenticated
              ? 'Checking authentication...'
              : loading
                ? 'Loading event...'
                : 'Verifying access...'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-500 mt-2">
              Auth: {auth.isAuthenticated ? 'authenticated' : 'checking'},
              Authorized: {auth.isAuthorized?.toString() ?? 'checking'},
              Loading: {loading}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show unauthorized message if user is not the event owner
  if (auth.isAuthenticated && auth.isAuthorized === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-4">
            You are not authorized to view this event page. Only the event
            creator can access this page.
          </p>
          <button
            onClick={() => router.push('/event')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Events
          </button>
        </div>
      </div>
    );
  }

  // Don't render if authentication hasn't completed successfully
  if (
    !auth.isAuthenticated ||
    auth.isAuthorized !== true ||
    !auth.user ||
    !event
  ) {
    return null;
  }

  // Format event dates
  const eventTimeZone = event.time_zone || 'America/Los_Angeles';
  const zonedStart = toZonedTime(event.start_date, eventTimeZone);
  const zonedEnd = toZonedTime(event.end_date, eventTimeZone);
  const formattedStart = format(zonedStart, 'MMM d, yyyy', {
    timeZone: eventTimeZone,
  });
  const formattedStartTime = format(zonedStart, 'h:mm aaaa', {
    timeZone: eventTimeZone,
  });
  const formattedEnd = format(zonedEnd, 'MMM d, yyyy', {
    timeZone: eventTimeZone,
  });
  const formattedEndTime = format(zonedEnd, 'h:mm aaaa', {
    timeZone: eventTimeZone,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Extended Hero Section with Header */}
      <div className="relative bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white overflow-hidden">
        {/* Background: subtle beams + dotted grid */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Thin rave-style light beams */}
          <div
            className="absolute top-0 left-1/2 w-32 h-full bg-gradient-to-b from-purple-600/50 via-purple-600/25 to-transparent transform -translate-x-[460px] skew-x-16"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          <div
            className="absolute top-0 left-1/2 w-24 h-full bg-gradient-to-b from-orange-400/60 via-orange-500/30 to-transparent transform -translate-x-[200px]"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          <div
            className="absolute top-0 left-1/2 w-28 h-full bg-gradient-to-b from-purple-400/55 via-purple-500/28 to-transparent transform -skew-x-16 translate-x-[60px]"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          {/* Dotted grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                'radial-gradient(currentColor 1px, transparent 1px)',
              color: '#ffffff',
              backgroundSize: '22px 22px',
              backgroundPosition: '0 0, 11px 11px',
            }}
          ></div>
        </div>

        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800/15 via-transparent to-indigo-800/25"></div>

        {/* Header integrated into hero */}
        <div className="relative z-20">
          <Header />
        </div>

        {/* Hero content */}
        <div className="relative px-6 py-16 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                {event.name}
              </h1>
              <div className="flex gap-3">
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="bg-red-800/20 border-red-500/50 text-red-300 hover:bg-red-800/40 hover:text-white"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => handleShare(event.id.toString())}
                  className="bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 shadow-lg hover:shadow-green-800/50 transition-all duration-200"
                >
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Invite Guests
                </Button>
                <Button
                  onClick={() => setShowScanner(true)}
                  className="bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 shadow-lg hover:shadow-blue-800/50 transition-all duration-200"
                >
                  <QrCodeIcon className="w-4 h-4 mr-2" />
                  Scan QR
                </Button>
              </div>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl">
              Manage your event details, track RSVPs, and verify payments
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 sm:px-8 lg:px-12">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Event Details Card */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Event Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <CalendarIcon className="w-5 h-5 mr-3 text-purple-300 flex-shrink-0" />
                <div>
                  <span className="font-medium">Start:</span> {formattedStart}{' '}
                  at {formattedStartTime}
                </div>
              </div>
              <div className="flex items-center text-gray-300">
                <ClockIcon className="w-5 h-5 mr-3 text-purple-300 flex-shrink-0" />
                <div>
                  <span className="font-medium">End:</span> {formattedEnd} at{' '}
                  {formattedEndTime}
                </div>
              </div>
              {event.location && (
                <div className="flex items-start text-gray-300">
                  <MapPinIcon className="w-5 h-5 mr-3 mt-0.5 text-purple-300 flex-shrink-0" />
                  <span className="text-sm">{event.location}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-gray-300 font-medium">Theme:</span>
                <span className="ml-2 px-3 py-1 bg-purple-800/30 rounded-full text-sm text-purple-300">
                  {event.theme}
                </span>
              </div>
              <div>
                <span className="text-gray-300 font-medium">Description:</span>
                <p className="mt-2 text-gray-300 text-sm">
                  {event.additional_info}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Upload Section - Admin Only */}
        {auth.user && event && auth.user.id === event.user_id && (
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">
              Payment Verification
            </h3>
            <p className="text-gray-300 mb-6">
              Upload your Venmo and Zelle statements to automatically verify
              payments with your RSVPs.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Zelle Statement (.txt)
                </label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleZelleUpload}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-800/50 file:text-purple-300 hover:file:bg-purple-800/70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Venmo Statement (.csv)
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleVenmoUpload}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-800/50 file:text-orange-300 hover:file:bg-orange-800/70"
                />
              </div>
            </div>
            {processingPayments && (
              <div className="mt-4 text-center">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-purple-300 text-sm">
                  Processing payments...
                </p>
              </div>
            )}
          </div>
        )}

        {/* RSVPs Section */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">RSVPs</h3>
            <div className="flex items-center text-gray-300">
              <UsersIcon className="w-5 h-5 mr-2 text-purple-300" />
              <span>{rsvps.length} guests</span>
            </div>
          </div>
          <DataTable
            columns={createColumns}
            data={rsvps}
            onSave={handleSave}
            onViewPaymentProof={handleViewPaymentProof}
            onAmountPaidChange={handleAmountPaidChange}
            onSendEmails={handleOpenEmailModal}
          />
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
              <Button
                onClick={() => setShowScanner(false)}
                variant="outline"
                size="sm"
                className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-6">
              {!verificationStatus && (
                <Scanner
                  onScan={handleScanSuccess}
                  onError={handleScanFailure}
                />
              )}
            </div>

            {verificationStatus && (
              <div className="text-center">
                <div
                  className={`rounded-lg p-4 text-2xl font-bold mb-4 ${
                    verificationStatus === 'Verified'
                      ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                      : 'bg-red-900/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {verificationStatus}
                </div>
                <p className="text-gray-300 text-sm">
                  {verificationStatus === 'Verified'
                    ? 'Guest verified successfully!'
                    : 'Guest not found in RSVP list'}
                </p>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setShowScanner(false)}
                className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-purple-800/50 transition-all duration-200"
              >
                Close Scanner
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      <PaymentProofModal
        isOpen={paymentProofModal.isOpen}
        onClose={handleClosePaymentProof}
        imageUrl={paymentProofModal.imageUrl}
        guestName={paymentProofModal.guestName}
      />

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModal.isOpen}
        onClose={handleCloseEmailModal}
        rsvps={rsvps}
        onSendEmails={handleSendEmails}
      />

      <Footer />
    </div>
  );
}

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
        'fixed top-4 right-4 z-50 rounded-lg border border-[#067a53]/20 bg-[#e4f5ec] px-6 py-3 text-sm text-[#067a53] shadow-lg';
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
      // Checking session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        // Session check error
        // If it's a refresh token error, sign out to clear invalid tokens
        if (
          error.message?.includes('refresh') ||
          error.message?.includes('Invalid')
        ) {
          // Clearing invalid session
          await supabase.auth.signOut();
        }
        return { isAuthenticated: false, user: null };
      }

      if (session?.user) {
        // Session found
        return { isAuthenticated: true, user: session.user };
      } else {
        // No session found
        return { isAuthenticated: false, user: null };
      }
    } catch (err) {
      // Session check failed
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
          // Error fetching event details
          setError(error.message);
          setEvent(null);
          return null;
        }

        if (data) {
          setEvent(data);
          setError(null);

          // Check if user is the event owner
          const isOwner = user.id === data.user_id;
          // Authorization check

          return { event: data, isOwner };
        } else {
          setError(
            'Event not found. The event may have been deleted or the link is invalid.'
          );
          setEvent(null);
          return null;
        }
      } catch (err) {
        // Unexpected error fetching event
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
        // Error fetching RSVPs
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
      // Unexpected error fetching RSVPs
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
    // QR code scan error
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
      // Initializing authentication on page load/refresh

      // Step 1: Check session (like calling backend getSession endpoint)
      const sessionResult = await checkSession();

      if (!sessionResult.isAuthenticated) {
        // Not authenticated, redirecting to Google auth
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
      // User is authenticated, checking event authorization
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
        // User is authorized as event owner
        setAuth(prev => ({
          ...prev,
          loading: false,
          isAuthorized: true,
        }));
        // Fetch RSVPs
        fetchRsvps();
      } else {
        // User is not the event owner
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
      // Auth state changed

      if (event === 'SIGNED_OUT') {
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false,
          isAuthorized: false,
        });
        router.replace('/api/auth/direct-google');
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
        // Error deleting RSVPs
        setError(rsvpError.message);
        return;
      }

      // Then, delete the event itself
      const { error: eventError } = await supabase
        .from('Events')
        .delete()
        .eq('id', eventId);

      if (eventError) {
        // Error deleting event
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
        // Error updating RSVPs
        setError(error.message);
        throw error;
      } else {
        await fetchRsvps(); // Refresh the data
        // Show success notification in a more modern way
        const successMessage = document.createElement('div');
        successMessage.className =
          'fixed top-4 right-4 z-50 rounded-lg border border-[#067a53]/20 bg-[#e4f5ec] px-6 py-3 text-sm text-[#067a53] shadow-lg';
        successMessage.textContent = 'Verification changes saved successfully!';
        document.body.appendChild(successMessage);

        // Remove the notification after 3 seconds
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
      }
    } catch (error) {
      // Error is already handled above
      // Save operation failed
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
              'fixed top-4 right-4 z-50 rounded-lg border border-border bg-white px-6 py-3 text-sm text-foreground shadow-lg';
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
          'fixed top-4 right-4 z-50 rounded-lg border border-border bg-white px-6 py-3 text-sm text-foreground shadow-lg';
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
                'fixed top-4 right-4 z-50 rounded-lg border border-border bg-white px-6 py-3 text-sm text-foreground shadow-lg';
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
        'fixed top-4 right-4 z-50 rounded-lg border border-[#067a53]/20 bg-[#e4f5ec] px-6 py-3 text-sm text-[#067a53] shadow-lg';
      
      if (failed > 0) {
        successMessage.textContent = `Emails sent from your Gmail! ${successful} successful, ${failed} failed`;
        // Email send results
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
      // Error sending emails
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className =
        'fixed top-4 right-4 z-50 rounded-lg border border-red-200 bg-red-50 px-6 py-3 text-sm text-red-600 shadow-lg';
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
      // Error updating payment status
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
      // Error processing Zelle file
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
      // Error processing Venmo file
      setError('Failed to process Venmo file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"></div>
          <p className="text-muted-foreground">Loading event details...</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">Fetching event data...</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-7 w-7 text-red-600"
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
          <p className="text-lg text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication or authorization
  if (auth.loading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"></div>
          <p className="text-muted-foreground">
            {!auth.isAuthenticated
              ? 'Checking authentication...'
              : loading
                ? 'Loading event...'
                : 'Verifying access...'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
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
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-7 w-7 text-red-600"
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
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            Access Denied
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            You are not authorized to view this event page. Only the event
            creator can access this page.
          </p>
          <Button onClick={() => router.push('/event')}>Go to Events</Button>
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
          {/* Page header */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                Event · Manage
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {event.name}
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Manage your event details, track RSVPs, and verify payments
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleEdit} variant="outline">
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                onClick={() => handleShare(event.id.toString())}
                variant="secondary"
              >
                <ShareIcon className="w-4 h-4 mr-2" />
                Invite Guests
              </Button>
              <Button onClick={() => setShowScanner(true)}>
                <QrCodeIcon className="w-4 h-4 mr-2" />
                Scan QR
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Stat tiles */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                Starts
              </div>
              <div className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                {formattedStart}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {formattedStartTime}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                <ClockIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                Ends
              </div>
              <div className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                {formattedEnd}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {formattedEndTime}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                <MapPinIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                Location
              </div>
              <div className="mt-3 break-words text-sm font-semibold text-foreground">
                {event.location || 'TBD'}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                <UsersIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                Guests
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                {rsvps.length}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                RSVPS RECEIVED
              </div>
            </div>
          </div>

          {/* Event Details Card */}
          <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Event Details
            </h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Theme
                </div>
                <span className="mt-2 inline-block rounded-md bg-muted px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground">
                  {event.theme}
                </span>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Description
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {event.additional_info}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Upload Section - Admin Only */}
          {auth.user && event && auth.user.id === event.user_id && (
            <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                Payment Matching
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Payment Verification
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Upload your Venmo and Zelle statements to automatically verify
                payments with your RSVPs.
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Zelle Statement (.txt)
                  </label>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleZelleUpload}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-[#eeedf3]"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Venmo Statement (.csv)
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleVenmoUpload}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-[#eeedf3]"
                  />
                </div>
              </div>
              {processingPayments && (
                <div className="mt-6 text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"></div>
                  <p className="text-sm text-muted-foreground">
                    Processing payments...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* RSVPs Section */}
          <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                RSVPs
              </h3>
              <span className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground">
                <UsersIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {rsvps.length} GUESTS
              </span>
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
      </main>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  Door Scanner
                </div>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  Scan QR Code
                </h3>
              </div>
              <Button
                onClick={() => setShowScanner(false)}
                variant="ghost"
                size="sm"
                aria-label="Close scanner"
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
              <div
                className={`rounded-xl px-4 py-3 ${
                  verificationStatus === 'Verified'
                    ? 'bg-[#e4f5ec]'
                    : 'bg-red-50'
                }`}
              >
                <div
                  className={`text-sm font-semibold ${
                    verificationStatus === 'Verified'
                      ? 'text-[#067a53]'
                      : 'text-red-600'
                  }`}
                >
                  {verificationStatus === 'Verified' ? '✓ ' : ''}
                  {verificationStatus}
                </div>
                <p
                  className={`mt-0.5 font-mono text-[10px] tracking-wide ${
                    verificationStatus === 'Verified'
                      ? 'text-[#067a53]/80'
                      : 'text-red-600/80'
                  }`}
                >
                  {verificationStatus === 'Verified'
                    ? 'Guest verified successfully!'
                    : 'Guest not found in RSVP list'}
                </p>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <Button onClick={() => setShowScanner(false)} variant="outline">
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

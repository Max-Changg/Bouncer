'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import type { Database } from '@/lib/database.types';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rsvps: (Database['public']['Tables']['rsvps']['Row'] & {
    ticket_name?: string;
    ticket_price?: number;
  })[];
  onSendEmails: (recipients: string[], message: string) => Promise<void>;
}

type SelectionType = 'all' | 'verified' | 'not-verified' | 'custom';

export default function EmailModal({ isOpen, onClose, rsvps, onSendEmails }: EmailModalProps) {
  const [selectionType, setSelectionType] = useState<SelectionType>('all');
  const [customRecipients, setCustomRecipients] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectionType('all');
      setCustomRecipients('');
      setEmailMessage('');
      setIsSending(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen]);

  // Generate suggestions for custom recipients
  const generateSuggestions = (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const inputLower = input.toLowerCase();
    // Create combined "Name (email)" format suggestions
    const combinedOptions = rsvps
      .filter(rsvp => rsvp.name && rsvp.email)
      .map(rsvp => `${rsvp.name} (${rsvp.email})`)
      .filter(option => option.toLowerCase().includes(inputLower));

    // Limit to 5 suggestions
    const uniqueSuggestions = [...new Set(combinedOptions)].slice(0, 5);
    setSuggestions(uniqueSuggestions);
    setShowSuggestions(uniqueSuggestions.length > 0);
  };

  const handleCustomRecipientsChange = (value: string) => {
    setCustomRecipients(value);
    
    // Get the current word being typed (after last comma)
    const words = value.split(',');
    const currentWord = words[words.length - 1].trim();
    generateSuggestions(currentWord);
  };

  const addSuggestion = (suggestion: string) => {
    const words = customRecipients.split(',');
    words[words.length - 1] = suggestion;
    setCustomRecipients(words.join(', ') + ', ');
    setShowSuggestions(false);
  };

  const getSelectedRecipients = (): string[] => {
    switch (selectionType) {
      case 'all':
        return rsvps.map(rsvp => rsvp.email).filter(email => email);
      case 'verified':
        return rsvps.filter(rsvp => rsvp.is_approved).map(rsvp => rsvp.email).filter(email => email);
      case 'not-verified':
        return rsvps.filter(rsvp => !rsvp.is_approved).map(rsvp => rsvp.email).filter(email => email);
      case 'custom':
        // Parse custom recipients (names, emails, or "Name (email)" format)
        const customList = customRecipients.split(',').map(item => item.trim()).filter(item => item);
        const emails: string[] = [];
        
        customList.forEach(item => {
          // Check if it's in "Name (email)" format
          const nameEmailMatch = item.match(/^(.+?)\s*\((.+@.+)\)$/);
          if (nameEmailMatch) {
            // Extract email from "Name (email)" format
            emails.push(nameEmailMatch[2]);
          } else if (item.includes('@')) {
            // It's a plain email
            emails.push(item);
          } else {
            // It's a plain name, find matching RSVP
            const matchingRsvp = rsvps.find(rsvp => 
              rsvp.name.toLowerCase() === item.toLowerCase()
            );
            if (matchingRsvp && matchingRsvp.email) {
              emails.push(matchingRsvp.email);
            }
          }
        });
        
        return emails;
      default:
        return [];
    }
  };

  const handleSend = async () => {
    const recipients = getSelectedRecipients();
    
    if (recipients.length === 0) {
      alert('No recipients selected or found.');
      return;
    }
    
    if (!emailMessage.trim()) {
      alert('Please enter a message to send.');
      return;
    }

    setIsSending(true);
    try {
      await onSendEmails(recipients, emailMessage.trim());
      onClose();
    } catch (error) {
      // Failed to send emails
      alert('Failed to send emails. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = getSelectedRecipients().length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim page overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_48px_-20px_rgba(20,19,24,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
              <EnvelopeIcon className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Send your guests a message!
            </h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] space-y-6 overflow-y-auto p-6">
          {/* Guest Selection */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Select Recipients
            </h4>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="radio"
                  name="selection"
                  value="all"
                  checked={selectionType === 'all'}
                  onChange={(e) => setSelectionType(e.target.value as SelectionType)}
                  className="h-4 w-4 accent-[#6d28d9]"
                />
                <span className="text-sm text-foreground">All guests ({rsvps.length} people)</span>
              </label>

              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="radio"
                  name="selection"
                  value="verified"
                  checked={selectionType === 'verified'}
                  onChange={(e) => setSelectionType(e.target.value as SelectionType)}
                  className="h-4 w-4 accent-[#6d28d9]"
                />
                <span className="text-sm text-foreground">
                  Guests who are verified ({rsvps.filter(r => r.is_approved).length} people)
                </span>
              </label>

              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="radio"
                  name="selection"
                  value="not-verified"
                  checked={selectionType === 'not-verified'}
                  onChange={(e) => setSelectionType(e.target.value as SelectionType)}
                  className="h-4 w-4 accent-[#6d28d9]"
                />
                <span className="text-sm text-foreground">
                  Guests who are not verified ({rsvps.filter(r => !r.is_approved).length} people)
                </span>
              </label>

              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="radio"
                  name="selection"
                  value="custom"
                  checked={selectionType === 'custom'}
                  onChange={(e) => setSelectionType(e.target.value as SelectionType)}
                  className="h-4 w-4 accent-[#6d28d9]"
                />
                <span className="text-sm text-foreground">Custom selection</span>
              </label>
            </div>
          </div>

          {/* Custom Recipients Input */}
          {selectionType === 'custom' && (
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Enter names or emails (comma separated)
              </label>
              <Input
                value={customRecipients}
                onChange={(e) => handleCustomRecipientsChange(e.target.value)}
                placeholder="John Doe, jane@example.com, ..."
                onFocus={() => generateSuggestions(customRecipients.split(',').pop()?.trim() || '')}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                      onMouseDown={() => addSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected count display */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">{selectedCount}</span> recipients will receive this message
            </p>
          </div>

          {/* Email Message */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows={8}
              className="w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border p-6">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || selectedCount === 0 || !emailMessage.trim()}
          >
            {isSending ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <>
                <EnvelopeIcon className="mr-2 h-4 w-4" />
                Send Emails
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

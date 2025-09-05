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
      console.error('Failed to send emails:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = getSelectedRecipients().length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative z-10 bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center">
            <EnvelopeIcon className="w-6 h-6 text-purple-300 mr-3" />
            <h3 className="text-xl font-bold text-white">Send your guests a message!</h3>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Guest Selection */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Select Recipients</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="selection"
                  value="all"
                  checked={selectionType === 'all'}
                  onChange={(e) => setSelectionType(e.target.value as SelectionType)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-gray-300">All guests ({rsvps.length} people)</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="selection"
                  value="verified"
                  checked={selectionType === 'verified'}
                  onChange={(e) => setSelectionType(e.target.value as SelectionType)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-gray-300">
                  Guests who are verified ({rsvps.filter(r => r.is_approved).length} people)
                </span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="selection"
                  value="not-verified"
                  checked={selectionType === 'not-verified'}
                  onChange={(e) => setSelectionType(e.target.value as SelectionType)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-gray-300">
                  Guests who are not verified ({rsvps.filter(r => !r.is_approved).length} people)
                </span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="selection"
                  value="custom"
                  checked={selectionType === 'custom'}
                  onChange={(e) => setSelectionType(e.target.value as SelectionType)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-gray-300">Custom selection</span>
              </label>
            </div>
          </div>

          {/* Custom Recipients Input */}
          {selectionType === 'custom' && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter names or emails (comma separated)
              </label>
              <Input
                value={customRecipients}
                onChange={(e) => handleCustomRecipientsChange(e.target.value)}
                placeholder="John Doe, jane@example.com, ..."
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                onFocus={() => generateSuggestions(customRecipients.split(',').pop()?.trim() || '')}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-600 transition-colors"
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
          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-sm text-gray-300">
              <span className="font-medium text-purple-300">{selectedCount}</span> recipients will receive this message
            </p>
          </div>

          {/* Email Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows={8}
              className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700/50">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || selectedCount === 0 || !emailMessage.trim()}
            className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-purple-800/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <>
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Send Emails
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

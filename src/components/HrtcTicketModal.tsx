import React, { useState } from 'react';
import { X, Printer, Bus, FolderDown, Check } from 'lucide-react';
import { HrtcTicket } from '../types';
import { HRTC_ROUTES } from '../data/pahadiData';

interface HrtcTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: HrtcTicket;
  onUpdateTicket: (updated: HrtcTicket) => void;
  onSaveToDrive?: (title: string, content: string) => void;
  isDriveConnected?: boolean;
}

export const HrtcTicketModal: React.FC<HrtcTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onUpdateTicket,
  onSaveToDrive,
  isDriveConnected
}) => {
  const [passengerName, setPassengerName] = useState<string>(ticket.passengerName || 'Traveller');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRouteSelect = (idx: number) => {
    setSelectedRouteIndex(idx);
    const r = HRTC_ROUTES[idx];
    onUpdateTicket({
      ...ticket,
      origin: r.origin,
      destination: r.destination,
      busNo: r.busNo,
      fare: r.fare,
      temperature: r.temp
    });
  };

  const handleNameChange = (name: string) => {
    setPassengerName(name);
    onUpdateTicket({
      ...ticket,
      passengerName: name
    });
  };

  const handleSaveDrive = () => {
    if (onSaveToDrive) {
      const title = `HRTC_Ticket_${ticket.ticketNumber}`;
      const content = `HIMACHAL ROAD TRANSPORT CORPORATION (HRTC)
Ticket No: #${ticket.ticketNumber}
Passenger: ${passengerName}
Route: ${ticket.origin} to ${ticket.destination}
Bus No: ${ticket.busNo}
Seat No: ${ticket.seatNo}
Fare: ${ticket.fare}
Temperature: ${ticket.temperature}
Issued: ${ticket.date}
Tagline: Safar Khubsurat Hai`;

      onSaveToDrive(title, content);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#141b17] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-amber-400" />
            <h2 className="font-garamond text-2xl font-semibold text-amber-200">
              HRTC Mountain Journey Pass
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Selector & Passenger Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block font-mono-space text-[10px] text-amber-300/80 mb-1 uppercase tracking-wider">
              Passenger Name
            </label>
            <input
              type="text"
              value={passengerName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 font-mono-space text-xs text-white focus:outline-none focus:border-amber-400"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block font-mono-space text-[10px] text-amber-300/80 mb-1 uppercase tracking-wider">
              Select HRTC Bus Route
            </label>
            <select
              value={selectedRouteIndex}
              onChange={(e) => handleRouteSelect(parseInt(e.target.value))}
              className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 font-mono-space text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {HRTC_ROUTES.map((r, i) => (
                <option key={i} value={i} className="bg-gray-900 text-white">
                  {r.origin} → {r.destination} ({r.fare})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vintage Ticket Card Visual */}
        <div className="bg-[#f2efe9] text-gray-900 p-5 rounded-xl border-2 border-dashed border-amber-900/30 shadow-inner font-mono-space relative overflow-hidden">
          {/* Watermark stamp */}
          <div className="absolute right-4 top-4 border-2 border-red-800/30 rounded-full px-3 py-1 font-bold text-[10px] text-red-800/40 uppercase rotate-[-12deg] pointer-events-none">
            HRTC OFFICIAL
          </div>

          <div className="text-center border-b border-gray-400 pb-2 mb-3">
            <h3 className="font-bold text-sm text-gray-800 tracking-widest uppercase">
              HIMACHAL ROAD TRANSPORT CORP.
            </h3>
            <p className="text-[9px] text-gray-600 tracking-wider">
              ESTD. 1994 • PA HADI ORDINARY / VOLVO EXPRESS
            </p>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div>
              <span className="text-[9px] text-gray-500 uppercase block">Ticket No</span>
              <span className="font-bold text-red-700">#{ticket.ticketNumber}</span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-gray-500 uppercase block">Seat No</span>
              <span className="font-bold text-gray-800">{ticket.seatNo} (Window)</span>
            </div>

            <div>
              <span className="text-[9px] text-gray-500 uppercase block">Passenger</span>
              <span className="font-semibold text-gray-800">{passengerName}</span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-gray-500 uppercase block">Bus No</span>
              <span className="font-mono text-gray-800">{ticket.busNo}</span>
            </div>

            <div>
              <span className="text-[9px] text-gray-500 uppercase block">Origin</span>
              <span className="font-bold text-gray-900 uppercase">{ticket.origin}</span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-gray-500 uppercase block">Destination</span>
              <span className="font-bold text-gray-900 uppercase">{ticket.destination}</span>
            </div>

            <div>
              <span className="text-[9px] text-gray-500 uppercase block">Fare Paid</span>
              <span className="font-bold text-emerald-800">{ticket.fare}</span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-gray-500 uppercase block">Route Temp</span>
              <span className="font-semibold text-gray-700">{ticket.temperature}</span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-400/80 text-center text-[10px] italic text-gray-600">
            "Safar khubsurat hai manzil se bhi..."
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-mono-space text-xs text-white transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>

          {onSaveToDrive && (
            <button
              onClick={handleSaveDrive}
              className={`px-4 py-2 rounded-xl font-mono-space text-xs transition flex items-center gap-2 cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-black font-semibold'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to Drive!</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-4 h-4" />
                  <span>{isDriveConnected ? 'Save to Google Drive' : 'Sync Ticket to Drive'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

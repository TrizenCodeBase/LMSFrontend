import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const AVATAR_STYLES = [
  'avataaars',
  'bottts',
  'pixelart',
  'lorelei',
  'initials',
  'micah'
];

interface AvatarSelectorProps {
  currentAvatar?: string;
  name: string;
  onAvatarChange: (newAvatarUrl: string) => Promise<void>;
  className?: string;
}

export function AvatarSelector({ currentAvatar, name, onAvatarChange, className }: AvatarSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState('avataaars');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const generateAvatarUrl = (style: string, seed: string) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

  const getDefaultAvatarUrl = (name: string) => {
    return generateAvatarUrl('avataaars', name);
  };

  const handleAvatarSelect = async (style: string) => {
    setIsLoading(true);
    const newAvatarUrl = generateAvatarUrl(style, name);
    try {
      await onAvatarChange(newAvatarUrl);
      setSelectedStyle(style);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className={cn("relative group cursor-pointer", className)}>
          <Avatar className="h-20 w-20 ring-4 ring-primary/10 transition-all duration-200 group-hover:ring-primary/30">
            <AvatarImage 
              src={currentAvatar || getDefaultAvatarUrl(name)} 
              alt={name} 
            />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="h-6 w-6 text-white" />
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar Style</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
          {AVATAR_STYLES.map((style) => (
            <Button
              key={style}
              variant="outline"
              className={cn(
                "h-auto p-4 flex flex-col items-center gap-3",
                selectedStyle === style && "ring-2 ring-primary"
              )}
              onClick={() => handleAvatarSelect(style)}
              disabled={isLoading}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={generateAvatarUrl(style, name)} 
                  alt={style} 
                />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <span className="capitalize text-sm">{style}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
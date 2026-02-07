import { Fragment, type ReactNode } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  className,
  wide,
}: SlideOverProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel
                  className={clsx(
                    'pointer-events-auto relative',
                    wide ? 'w-screen max-w-lg' : 'w-screen max-w-md',
                    className
                  )}
                >
                  <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-2xl">
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                          </DialogTitle>
                          {description && (
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                              {description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={onClose}
                          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      {children}
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

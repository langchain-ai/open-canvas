import { Dispatch, SetStateAction } from "react";
import React from "react";
import { HexColorPicker } from "react-colorful";
import { motion, AnimatePresence } from "framer-motion";

interface ColorPickerProps {
  iconColor: string;
  setIconColor: Dispatch<SetStateAction<string>>;
  showColorPicker: boolean;
  setShowColorPicker: Dispatch<SetStateAction<boolean>>;
  hoverTimer: NodeJS.Timeout | null;
  setHoverTimer: Dispatch<SetStateAction<NodeJS.Timeout | null>>;
  disabled: boolean;
}

export function ColorPicker(props: ColorPickerProps) {
  const {
    iconColor,
    setIconColor,
    showColorPicker,
    setShowColorPicker,
    hoverTimer,
    setHoverTimer,
  } = props;

  const handleMouseEnter = () => {
    if (props.disabled) return;
    const timer = setTimeout(() => {
      setShowColorPicker(true);
    }, 200);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    setShowColorPicker(false);
  };

  return (
    <div className="relative">
      <div
        className="h-9 w-9 rounded-md cursor-pointer hover:ring-2 ring-offset-2 ring-gray-400 transition-all ease-in-out duration-200"
        style={{ backgroundColor: iconColor }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => {
          if (hoverTimer) {
            clearTimeout(hoverTimer);
          }
        }}
      />
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 z-50"
            onMouseEnter={() => setShowColorPicker(true)}
            onMouseLeave={handleMouseLeave}
          >
            <HexColorPicker
              aria-disabled={props.disabled}
              color={iconColor}
              onChange={(e) => {
                if (props.disabled) return;

                if (!e.startsWith("#")) {
                  setIconColor("#" + e);
                } else {
                  setIconColor(e);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

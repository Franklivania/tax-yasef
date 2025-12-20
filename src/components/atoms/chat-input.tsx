import { useState, useRef, useEffect } from "react";
import { ModelOptions } from "@/lib/types/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useModelStore } from "@/lib/store/useModelStore";
import { Image } from "../ui/image";
import { Icon } from "@iconify/react";

export default function ChatInput() {
  const model = useModelStore((state) => state.model);
  const setModel = useModelStore((state) => state.setModel);
  const getModelValue = useModelStore((state) => state.getModelValue);
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate the new height, but cap it at 250px
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 250;

    if (scrollHeight <= maxHeight) {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = "hidden";
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="w-full p-1 rounded-3xl light-gradient">
      <div className="w-full h-full bg-muted rounded-3xl p-6 grid gap-3">
        <div className="w-full flex items-start gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            className="w-full resize-none outline-none border-none no-scrollbar min-h-10 font-nunito"
            style={{ maxHeight: "250px" }}
            placeholder="Make we talk this Nigerian Tax thing..."
          />
          <button
            type="button"
            className="p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-all duration-300"
          >
            <Icon icon="iconamoon:send-light" className="size-8 -rotate-45" />
          </button>
        </div>
        <section className="flex items-center gap-2">
          <Image src="/favicon.ico" alt="Tax Yasef" width={32} height={32} />
          <Select
            value={getModelValue()}
            onValueChange={(selectedValue) => {
              const selectedOption = ModelOptions.find(
                (option) => option.value === selectedValue
              );
              if (selectedOption) {
                setModel(selectedOption.label);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={model} />
            </SelectTrigger>
            <SelectContent>
              {ModelOptions.map((modelOption) => (
                <SelectItem key={modelOption.value} value={modelOption.value}>
                  {modelOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      </div>
    </div>
  );
}

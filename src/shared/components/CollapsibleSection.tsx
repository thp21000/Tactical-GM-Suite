import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

type CollapsibleSectionProps = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="collapsible-section">
      <button
        className="collapsible-section__header"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <strong>{title}</strong>
          {summary ? <small>{summary}</small> : null}
        </span>
        <ChevronDown
          className={clsx("collapsible-section__icon", isOpen && "collapsible-section__icon--open")}
          size={16}
          aria-hidden="true"
        />
      </button>

      {isOpen ? <div className="collapsible-section__body">{children}</div> : null}
    </section>
  );
}

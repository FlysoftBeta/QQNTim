import { cl } from "../utils/consts";
import { Fragment, ReactNode, useState } from "react";

export function SettingsSection({ title, children, buttons }: { title: string; children: ReactNode; buttons?: ReactNode }) {
    return (
        <div className={cl.panel.section.c}>
            <span className={cl.panel.section.header.c}>
                <h2 className={cl.panel.section.header.title.c}>{title}</h2>
                {!!buttons && <div className={cl.panel.section.header.buttons.c}>{buttons}</div>}
            </span>
            <div className={cl.panel.section.content.c}>{children}</div>
        </div>
    );
}

export function SettingsBox({ children }: { children: ReactNode }) {
    return <div className={cl.panel.box.c}>{children}</div>;
}

export function SettingsBoxItem({ title, description, children, isLast = false }: { title: string; description?: string[]; children?: ReactNode; isLast?: boolean }) {
    return (
        <label className={`${cl.panel.box.item.c}${isLast ? ` ${cl.panel.box.item.last.c}` : ""}`}>
            <span>
                <span className={cl.panel.box.item.title.c}>{title}</span>
                {description ? (
                    <span className={cl.panel.box.item.description.c}>
                        {description.map((text, idx, array) => {
                            return (
                                // rome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                <Fragment key={idx}>
                                    <span>{text}</span>
                                    {idx != array.length - 1 && <br />}
                                </Fragment>
                            );
                        })}
                    </span>
                ) : null}
            </span>
            <div>{children}</div>
        </label>
    );
}

export function Switch({ checked, onToggle }: { checked: boolean; onToggle: (checked: boolean) => void }) {
    return (
        <div className={`q-switch${checked ? " is-active" : ""}`} onClick={() => onToggle(!checked)}>
            <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} />
            <div className="q-switch__handle" />
        </div>
    );
}

export function Input({ value, onChange, width }: { value: string; onChange: (value: string) => void; width }) {
    const [focus, setFocus] = useState<boolean>(false);

    return (
        <div className="q-input" style={{ border: "1px solid var(--divider_dark)", height: "26px", width: width, background: "var(--bg_white)", boxSizing: "border-box", position: "relative" }}>
            <input
                type="text"
                className="q-input__inner"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                spellCheck={false}
                style={{
                    fontSize: "12px",
                    height: "26px",
                    lineHeight: "26px",
                    padding: "0 32px 0 8px",
                    border: "1px solid transparent",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    ...(focus && {
                        border: " 1px solid var(--brand_standard)",
                        borderRadius: "4px",
                        caretColor: "var(--brand_standard)",
                    }),
                }}
            />
        </div>
    );
}

export function Dropdown<T>({ items, selected, onChange, width }: { items: [T, string][]; selected: T; onChange: (id: T) => void; width: string }) {
    const [open, setOpen] = useState<boolean>(false);
    const [selectedId, selectedContent] = items.find(([id]) => id == selected)!;

    return (
        <div className="q-pulldown-menu small-size" style={{ width: width }}>
            <div className="q-pulldown-menu-button" onClick={() => setOpen((prev) => !prev)}>
                <div className="content">{selectedContent}</div>
                <span className="icon">
                    <i
                        className="q-icon"
                        style={{
                            width: "16px",
                            height: "16px",
                            color: "inherit",
                            alignItems: "center",
                            display: "inline-flex",
                            justifyContent: "center",
                        }}
                    >
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "16px", height: "16px" }}>
                            <path d="M12 6.0001L8.00004 10L4 6" stroke="currentColor" strokeLinejoin="round" />
                        </svg>
                    </i>
                </span>
            </div>
            {open && (
                <div className="q-pulldown-menu-wrapper">
                    <ul className="q-pulldown-menu-list" style={{ maxHeight: "unset" }}>
                        {items.map(([id, content]) => {
                            const isSelected = id == selectedId;
                            return (
                                <li
                                    className={`q-pulldown-menu-list-item${isSelected ? " selected" : ""}`}
                                    tabIndex={0}
                                    onClick={() => {
                                        onChange(id);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="content">{content}</span>
                                    {isSelected && (
                                        <span className="icon">
                                            <i
                                                className="q-icon"
                                                style={{
                                                    width: "1em",
                                                    height: "1em",
                                                    color: "inherit",
                                                    alignItems: "center",
                                                    display: "inline-flex",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "1em", height: "1em" }}>
                                                    <path d="M2 7L6.00001 11L14 3" stroke="currentColor" strokeLinejoin="round" />
                                                </svg>
                                            </i>
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

export function Button({ onClick, primary, small, children }: { onClick: () => void; primary: boolean; small: boolean; children: ReactNode }) {
    return (
        <button className={`q-button q-button--default ${primary ? "q-button--primary" : "q-button--secondary"}${small ? " q-button--small" : ""}`} onClick={() => onClick()}>
            <span className="q-button__slot-warp">{children}</span>
        </button>
    );
}

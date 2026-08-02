import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components";
import { EmojiInfo } from "./Picker";

interface Props {
    /**
     * Active emoji information
     */
    active: {
        emoji: EmojiInfo | null;
    };

    /**
     * Emoji component
     */
    renderEmoji: React.FC<{ emoji: string }>;
}

/**
 * Constant-height footer: it must not appear and disappear with hover,
 * or the grid above jumps by its height every time.
 */
const Base = styled.div`
    gap: 10px;
    height: 48px;
    padding: 0 14px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    flex-direction: row;

    /* Same surface as the panel — no contrasting strip. */
    color: var(--foreground);

    img {
        width: 28px;
        height: 28px;
        object-fit: contain;
    }
`;

const Shortcode = styled.span`
    min-width: 0;
    font-size: 0.85em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--secondary-foreground);
    font-family: var(--monospace-font, monospace);
`;

const Hint = styled.span`
    font-size: 0.8em;
    color: var(--tertiary-foreground);
`;

export const EmojiPreview = observer(
    ({ active, renderEmoji: Emoji }: Props) => {
        return (
            <Base>
                {active.emoji ? (
                    <>
                        <Emoji emoji={active.emoji.id} />
                        <Shortcode>
                            :{active.emoji.name ?? active.emoji.id}:
                        </Shortcode>
                    </>
                ) : (
                    <Hint>Hover an emoji</Hint>
                )}
            </Base>
        );
    },
);

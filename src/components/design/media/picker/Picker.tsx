import { observable } from "mobx";
import React, { memo, useMemo, useRef, useState } from "react";
import { GroupedVirtuoso, GroupedVirtuosoHandle } from "react-virtuoso";
import styled, { css, keyframes } from "styled-components";

import useCloseHook from "../../../../lib/closeHook";

import { Avatar, Column, InputBox } from "../../atoms";
import { EmojiPreview } from "./EmojiPreview";

/**
 * Category of emoji
 */
type Category = {
    id: string;
    name: string;
    emoji?: string;
    iconURL?: string;
};

/**
 * Emoji information
 */
export type EmojiInfo = {
    id: string;
    name?: string;
};

interface Props {
    /**
     * All available emojis
     */
    emojis: Record<string | "default", EmojiInfo[]>;

    /**
     * Ordered list of categories
     */
    categories: Category[];

    /**
     * Emoji component
     */
    renderEmoji: React.FC<{ emoji: string }>;

    /**
     * Select emoji handler
     */
    onSelect?: (emoji: string) => void;

    /**
     * Handle clicking outside of picker
     */
    onClose?: () => void;

    /**
     * Render without the floating panel chrome, for use inside a
     * surface that already provides it.
     */
    embedded?: boolean;
}

/**
 * Hard-coded row size
 * ! FIXME: this will be calculated automatically later I guess
 */
const ROW_SIZE = 8;

/**
 * Entrance: quick scale from the trigger's corner (the emoji button sits
 * at the bottom-right), per-popover origin awareness.
 */
const pickerIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.97) translateY(4px);
    }
`;

/**
 * Base layout of the picker
 */
/**
 * Drops the panel chrome so the picker can sit inside a surface that
 * already provides it (the composer's tabbed emoji/GIF panel), instead
 * of floating as a second sheet on top of one.
 */
const embeddedChrome = css`
    position: static;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    animation: none;
`;

const Base = styled(Column)<{ embedded?: boolean }>`
    overflow: hidden;
    user-select: none;
    position: absolute;

    /* Above in-message stackers (the Button atom is z-index 1, so invite
       embeds' Join buttons paint over DOM order) and the floating bars
       (z-index 2) — a popover outranks both. */
    z-index: 3;

    right: 10px;
    bottom: 10px;

    // rows + row padding + scrollbar + group selector
    width: calc(${ROW_SIZE} * 40px + 12px + 10px + 44px);
    height: 440px;

    max-width: calc(100vw - 20px);
    max-height: calc(75vh);

    /* One flat surface for the whole panel (sheet colour, one elevation
       step above the recessed chat panel); separation comes from the
       drop shadow alone — no ring, no contrasting strips. */
    background: var(--background);
    border-radius: var(--radius-xl, 20px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);

    transform-origin: bottom right;
    animation: ${pickerIn} 140ms cubic-bezier(0.23, 1, 0.32, 1);

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }

    ${(props) => props.embedded && embeddedChrome}
`;

/**
 * Top search controls parent component
 */
const Controls = styled(Column)`
    padding: 10px 10px 6px;

    /* Search field speaks the header search-pill language. */
    input {
        padding: 9px 14px;
        font-size: 0.9em;
        border-radius: var(--radius-xl, 20px);
        background: var(--primary-header);

        &::placeholder {
            color: var(--secondary-foreground);
        }

        &:hover,
        &:focus-visible {
            background: var(--primary-header);
        }
    }
`;

/**
 * Picker parent component
 */
const Parent = styled.div`
    flex-grow: 1;
    min-height: 0;

    display: flex;
    flex-direction: row;

    /* Thin scrollbar inside the popover. */
    div::-webkit-scrollbar {
        width: 8px;
    }

    div::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background: var(--scrollbar-thumb);
        background-clip: padding-box;
        border: 2px solid transparent;
    }
`;

/**
 * Group selector
 */
const Groups = styled.div`
    width: 44px;

    overflow-y: scroll;
    scrollbar-width: none;

    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 4px 0;

    &::-webkit-scrollbar {
        width: 0px;
    }
`;

/**
 * Wrapper around individual emojis in the grid
 */
const EmojiContainer = styled.a`
    display: grid;
    place-items: center;

    width: 40px;
    height: 40px;

    cursor: pointer;
    border-radius: var(--radius-md, 8px);
    transition: background-color 80ms ease, transform 100ms ease-out;

    @media (hover: hover) and (pointer: fine) {
        &:hover {
            background: var(--nav-hover, var(--tertiary-background));
        }
    }

    &:active {
        transform: scale(0.94);
    }

    img {
        width: 27px;
        height: 27px;
        object-fit: contain;
    }
`;

/**
 * Wrapper around category rows
 */
const RowContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

/**
 * Custom component for category bar
 */
const CategoryBar = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 8px 4px;
    background: var(--background);
`;

/**
 * Custom component for category icon
 */
const CategoryIcon = styled.div<{ size?: number }>`
    display: grid;
    place-items: center;

    width: ${(props) => props.size ?? 16}px;
    height: ${(props) => props.size ?? 16}px;

    user-select: none;
    pointer-events: none;

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;

/**
 * Custom component for category name
 */
const CategoryName = styled.span`
    min-width: 0;
    flex-grow: 1;
    text-align: left;

    font-size: 0.75em;
    font-weight: 600;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--secondary-foreground);

    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

/**
 * Generated information from query and given categories / emojis
 */
type Generated = {
    /**
     * Emoji items
     */
    items: EmojiInfo[][];

    /**
     * Emoji count for each category
     */
    categoryCounts: number[];

    /**
     * Currently visible categories
     */
    activeCategories: Category[];
};

/**
 * Emoji Picker (later media picker, will need to refactor slightly)
 */
export function Picker({
    emojis,
    categories,
    renderEmoji: Emoji,
    onSelect,
    onClose,
    embedded,
}: Props) {
    // Take a ref of Virtuoso for scrolling to groups
    const ref = useRef<GroupedVirtuosoHandle>(null);

    // Keep track of user queries
    const [query, setQuery] = useState("");

    // Keep track of "active" emoji (on hover)
    const active: { emoji: EmojiInfo | null } = observable({ emoji: null });

    // Generate all the information required to render the grid
    const { items, categoryCounts, activeCategories }: Generated =
        useMemo(() => {
            // Prepare query
            const q = query.trim().toLowerCase();

            // Prepare data structures
            const items: EmojiInfo[][] = [];
            const activeCategories: Category[] = [];
            const categoryCounts: number[] = [];

            // Iterate through all categories
            for (const cat of categories) {
                let append = emojis[cat.id] ?? [];

                // Check if we match search query
                if (q) {
                    // This may be quite slow
                    append = append.filter((emoji) =>
                        emoji.name
                            ? emoji.name.includes(q)
                            : emoji.id.includes(q),
                    );

                    // Drop out if nothing found
                    if (append.length === 0) {
                        continue;
                    }
                }

                const sliceArray = (
                    array: EmojiInfo[],
                    size: number,
                ): EmojiInfo[][] => {
                    const result = [];
                    for (let i = 0; i < array.length; i += size) {
                        result.push(array.slice(i, i + size));
                    }
                    return result;
                };

                // Slice emoji collection into chunks of maximum length of ROW_SIZE
                const categoryEmojis = sliceArray(append, ROW_SIZE);

                // Append emojis to full list
                items.push(...categoryEmojis);

                // Append category to active list
                activeCategories.push(cat);

                // Append category length
                categoryCounts.push(categoryEmojis.length);
            }

            return {
                items,
                categoryCounts,
                activeCategories,
            };
        }, [query, categories, emojis]);

    // Component for rendering each row of emojis
    const Row = useMemo(
        () =>
            memo(({ index }: { index: number }) => (
                <>
                    {items[index].map((emoji) => (
                        <EmojiContainer
                            key={emoji.id}
                            onClick={(ev) => {
                                onSelect?.(emoji.id);

                                if (!ev.shiftKey) {
                                    onClose?.();
                                }
                            }}
                            onMouseOver={() => (active.emoji = emoji)}>
                            <Emoji emoji={emoji.id} />
                        </EmojiContainer>
                    ))}
                </>
            )),
        [items, active, onClose, onSelect, Emoji],
    );

    // Component for rendering group icons
    const Icon = useMemo(
        () =>
            memo(
                ({ category, size }: { category: Category; size?: number }) => (
                    <CategoryIcon size={size}>
                        {category.emoji ? (
                            <Emoji emoji={category.emoji} />
                        ) : (
                            <Avatar
                                size={size ?? 16}
                                fallback={category.name}
                                src={category.iconURL}
                            />
                        )}
                    </CategoryIcon>
                ),
            ),
        [Emoji],
    );

    // Register mouse events to close
    const baseRef = useCloseHook(onClose);

    return (
        <Base gap="0" ref={baseRef} embedded={embedded}>
            <Controls>
                <InputBox
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Type to search..."
                />
            </Controls>
            <Parent>
                <GroupedVirtuoso
                    ref={ref}
                    style={{
                        flexGrow: 1,
                        padding: "0 6px",
                        overflowX: "hidden",
                    }}
                    components={{
                        Item: RowContainer,
                    }}
                    groupCounts={categoryCounts}
                    groupContent={(groupIndex) => {
                        const category = activeCategories[groupIndex];

                        return (
                            <CategoryBar>
                                <Icon category={category} />
                                <CategoryName>{category.name}</CategoryName>
                            </CategoryBar>
                        );
                    }}
                    itemContent={(itemIndex) => <Row index={itemIndex} />}
                />
                <Groups>
                    {activeCategories.map((cat, groupIndex) => (
                        <EmojiContainer
                            key={cat.id}
                            onClick={() =>
                                ref.current?.scrollToIndex({ groupIndex })
                            }>
                            <Icon category={cat} size={20} />
                        </EmojiContainer>
                    ))}
                </Groups>
            </Parent>
            <EmojiPreview active={active} renderEmoji={Emoji} />
        </Base>
    );
}

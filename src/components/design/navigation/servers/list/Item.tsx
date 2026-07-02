import { observer } from "mobx-react-lite";
import React from "react";
import styled, { css } from "styled-components";
import type { Server } from "revolt.js";
import { DraggableProps } from "../../../../common";

import { Avatar } from "../../../atoms";
import { Unreads } from "../../../atoms/indicators/Unreads";
import { useLink, useTrigger } from "../../../../../lib/context";
import { Tooltip } from "../../../atoms/indicators/Tooltip";
import { INotificationChecker } from "revolt.js/dist/util/Unreads";

export const ItemContainer = styled.div<{
    head?: boolean;
    indicator?: "selected" | "alert";
}>`
    width: 56px;
    padding-left: 7px;
    padding-right: 7px;
    padding-bottom: 6px;

    cursor: pointer;
    position: relative;

    /* Selection indicator: a rounded sliver hugging the rail edge that
       grows with state — 16px on hover, 8px when unread, 32px when the
       server is open. */
    &::before {
        content: " ";
        position: absolute;
        left: -8px;
        width: 12px;
        height: 0;
        top: ${(props) => (props.head ? "27px" : "21px")};
        transform: translateY(-50%);
        border-radius: 4px;
        background: var(--foreground);
        transition: 0.15s ease height;
    }

    &:hover::before {
        height: 16px;
    }

    ${(props) =>
        props.indicator === "alert" &&
        css`
            &::before {
                height: 8px;
            }
        `}

    ${(props) =>
        props.indicator === "selected" &&
        css`
            &::before {
                height: 32px !important;
            }
        `}

    ${(props) =>
        props.head &&
        css`
            padding-top: 6px;
        `}
`;

const Inner = observer(({ item, permit }: InnerProps) => {
    const Link = useLink();
    const Trigger = useTrigger();
    const unread = !!item.isUnread(permit);
    const count = item.getMentions(permit).length;

    return (
        <Tooltip content={item.name} div right>
            <Trigger id="Menu" data={{ server: item._id, unread }}>
                <Link to={"/server/" + item._id}>
                    <Avatar
                        size={42}
                        interactive
                        fallback={item.name}
                        holepunch={(unread || count > 0) && "top-right"}
                        overlay={<Unreads unread={unread} count={count} />}
                        src={item.generateIconURL({ max_side: 256 }, false)}
                    />
                </Link>
            </Trigger>
        </Tooltip>
    );
});

export type InnerProps = {
    item: Server;
    permit: INotificationChecker;
};

type Props = DraggableProps<Server> &
    InnerProps & {
        active: boolean;
    };

export const Item = observer(
    ({ provided, isDragging, active, ...innerProps }: Props) => {
        const unread = !!innerProps.item.isUnread(innerProps.permit);
        const count = innerProps.item.getMentions(innerProps.permit).length;

        return (
            <ItemContainer
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
                style={provided.draggableProps.style}
                indicator={
                    active
                        ? "selected"
                        : unread || count > 0
                        ? "alert"
                        : undefined
                }>
                <Inner {...innerProps} />
            </ItemContainer>
        );
    },
);

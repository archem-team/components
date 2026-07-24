import styled, { css } from "styled-components";

export interface Props {
    readonly palette?: "primary" | "secondary";
}

export const InputBox = styled.input<Props>`
    //min-height: 42px;
    width: 100%;
    padding: 11px 16px;

    font-size: 0.9375rem;
    font-family: inherit;
    font-weight: 500;

    border: none;
    border-radius: var(--border-radius);
    box-sizing: border-box;
    outline: none;

    transition: 0.1s ease-in-out all;

    &:disabled {
        filter: brightness(0.9);
    }

    &:focus-visible {
        box-shadow: 0 0 0 1.5pt var(--focus-ring, var(--accent));
    }

    ${(props) =>
        props.palette === "primary"
            ? css`
                  color: var(--foreground);
                  background: var(--surface-sunken, #100518);

                  &:hover {
                      background: var(--hover);
                  }
              `
            : css`
                  color: var(--secondary-foreground);
                  /* One step above the panel (as production renders it) —
                     a sunken well here matches the panel exactly and the
                     input disappears. */
                  background: var(--secondary-background);

                  &:hover {
                      background: var(--hover);
                  }
              `}
`;

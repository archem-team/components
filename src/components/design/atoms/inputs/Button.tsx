import styled, { css } from "styled-components";

export interface Props {
    readonly compact?: boolean | "icon";
    readonly palette?:
        | "primary"
        | "secondary"
        | "plain"
        | "plain-secondary"
        | "accent"
        | "success"
        | "warning"
        | "error";
}

export const Button = styled.button<Props>`
    z-index: 1;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;
    font-weight: 500;
    font-family: inherit;

    transition: 0.1s ease all;

    border: none;
    cursor: pointer;
    border-radius: var(--border-radius);

    &:disabled {
        cursor: not-allowed;
    }

    ${(props) =>
        props.compact === "icon"
            ? css`
                  height: 38px;
                  width: 38px;
              `
            : props.compact
            ? css`
                  min-width: 96px;
                  font-size: 0.8125rem;
                  height: 32px !important;
                  padding: 2px 12px !important;
              `
            : css`
                  height: 38px;
                  min-width: 96px;
                  padding: 2px 16px;
                  font-size: 0.8125rem;
              `}

    ${(props) => {
        switch (props.palette) {
            // Neutral buttons are mixed off --primary-background rather than
            // painted with a surface token: they most often sit ON
            // --primary-background (modal action bars, settings panes), where
            // the old --secondary-header/--primary-background fills were a
            // near-invisible 1.0-1.1:1 against the surface behind them.
            // Mixing toward --foreground lifts them on dark themes and
            // deepens them on light ones. Secondary stays the louder of the
            // two, as before.
            case "secondary":
                return css`
                    font-weight: 500;
                    color: var(--foreground);
                    background: color-mix(
                        in srgb,
                        var(--primary-background),
                        var(--foreground) 14%
                    );

                    &:hover {
                        background: color-mix(
                            in srgb,
                            var(--primary-background),
                            var(--foreground) 20%
                        );
                    }

                    &:disabled {
                        background: color-mix(
                            in srgb,
                            var(--primary-background),
                            var(--foreground) 14%
                        );
                    }

                    &:active {
                        background: color-mix(
                            in srgb,
                            var(--primary-background),
                            var(--foreground) 8%
                        );
                    }
                `;
            case "plain":
            case "plain-secondary":
                return css`
                    color: ${props.palette === "plain"
                        ? "var(--foreground)"
                        : "var(--secondary-foreground)"};
                    background: transparent;

                    &:hover {
                        text-decoration: underline;
                    }

                    &:disabled {
                        opacity: 0.5;
                    }

                    &:active {
                        color: var(--tertiary-foreground);
                    }
                `;
            case "accent":
            case "success":
            case "warning":
            case "error":
                return css`
                    font-weight: 600;
                    color: var(--${props.palette}-contrast);
                    background: var(--${props.palette});

                    &:hover {
                        filter: brightness(1.2);
                    }

                    &:active {
                        filter: brightness(0.8);
                    }

                    &:disabled {
                        filter: brightness(0.7);
                    }
                `;
            default:
            case "primary":
                return css`
                    font-weight: 500;
                    color: var(--foreground);
                    background: color-mix(
                        in srgb,
                        var(--primary-background),
                        var(--foreground) 8%
                    );

                    &:hover {
                        background: color-mix(
                            in srgb,
                            var(--primary-background),
                            var(--foreground) 11%
                        );
                    }

                    &:disabled {
                        background: color-mix(
                            in srgb,
                            var(--primary-background),
                            var(--foreground) 8%
                        );
                    }

                    &:active {
                        background: color-mix(
                            in srgb,
                            var(--primary-background),
                            var(--foreground) 4%
                        );
                    }
                `;
        }
    }}
`;

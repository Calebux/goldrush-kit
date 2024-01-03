import { type Option, None, Some } from "@/utils/option";
import { type TokenV2Volume, prettifyCurrency } from "@covalenthq/client-sdk";
import { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    type ColumnDef,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenAvatar } from "../../../Atoms/TokenAvatar/TokenAvatar";
import { Button } from "@/components/ui/button";
import { AccountCardView } from "@/components/Molecules/AccountCardView/AccountCardView";
import { TableHeaderSorting } from "@/components/ui/tableHeaderSorting";
import { sum } from "lodash";
import { IconWrapper } from "@/components/Atoms/IconWrapper/IconWrapper";
import { GRK_SIZES } from "@/utils/constants/shared.constants";
import { useCovalent } from "@/utils/store/Covalent";
import { type XYKTokenListViewProps } from "@/utils/types/organisms.types";

export const XYKTokenListView: React.FC<XYKTokenListViewProps> = ({
    chain,
    dex_name,
    on_token_click,
}) => {
    const { covalentClient } = useCovalent();

    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "quote_rate",
            desc: true,
        },
    ]);
    const [rowSelection, setRowSelection] = useState({});
    const [maybeResult, setResult] = useState<Option<TokenV2Volume[]>>(None);
    const [error, setError] = useState({ error: false, error_message: "" });
    const [windowWidth, setWindowWidth] = useState<number>(0);

    useEffect(() => {
        (async () => {
            setResult(None);
            let response;
            try {
                response =
                    await covalentClient.XykService.getNetworkExchangeTokens(
                        chain,
                        dex_name
                    );
                setError({ error: false, error_message: "" });
                console.log(response);
                setResult(new Some(response.data.items));
            } catch (exception) {
                setResult(new Some([]));
                setError({
                    error: response ? response.error : false,
                    error_message: response ? response.error_message : "",
                });
            }
        })();
    }, [chain, dex_name]);

    useEffect(() => {
        setWindowWidth(window.innerWidth);

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const columns: ColumnDef<TokenV2Volume>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    className="mx-1"
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    className="mx-1"
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "contract_name",
            accessorKey: "contract_name",
            header: ({ column }) => (
                <TableHeaderSorting
                    align="left"
                    header_name={"Token"}
                    column={column}
                />
            ),
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-3">
                        <TokenAvatar
                            size={GRK_SIZES.EXTRA_SMALL}
                            token_url={row.original.logo_url}
                        />
                        <div className="flex flex-col">
                            <label className="text-base">
                                {row.original.contract_name
                                    ? row.original.contract_name
                                    : "FIXME"}
                            </label>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "contract_ticker_symbol",
            accessorKey: "contract_ticker_symbol",
            header: ({ column }) => (
                <TableHeaderSorting
                    align="right"
                    header_name={"Symbol"}
                    column={column}
                />
            ),
            cell: ({ row }) => {
                return (
                    <div className="text-right">
                        {row.original.contract_ticker_symbol}
                    </div>
                );
            },
        },
        {
            id: "total_liquidity_quote",
            accessorKey: "total_liquidity_quote",
            header: ({ column }) => (
                <TableHeaderSorting
                    align="right"
                    header_name={"Liquidity"}
                    column={column}
                />
            ),
            cell: ({ row }) => {
                const valueFormatted = prettifyCurrency(
                    row.original.total_liquidity_quote
                );

                return <div className="text-right">{valueFormatted}</div>;
            },
        },
        {
            id: "total_volume_24h_quote",
            accessorKey: "total_volume_24h_quote",
            header: ({ column }) => (
                <TableHeaderSorting
                    align="right"
                    header_name={"Volume (24hrs)"}
                    column={column}
                />
            ),
            cell: ({ row }) => {
                const valueFormatted = prettifyCurrency(
                    row.original.total_volume_24h_quote
                );

                return <div className="text-right">{valueFormatted}</div>;
            },
        },
        {
            id: "quote_rate",
            accessorKey: "quote_rate",
            header: ({ column }) => (
                <TableHeaderSorting
                    align="right"
                    header_name={"Quote Rate"}
                    column={column}
                />
            ),
            cell: ({ row }) => {
                return (
                    <div className="text-right">
                        {" "}
                        {prettifyCurrency(
                            row.getValue("quote_rate"),
                            2,
                            "USD",
                            true
                        )}{" "}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="ml-auto  ">
                                    <span className="sr-only">Open menu</span>
                                    <IconWrapper icon_class_name="expand_more" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => {
                                        if (on_token_click) {
                                            on_token_click(
                                                row.original.contract_address
                                            );
                                        }
                                    }}
                                >
                                    <IconWrapper
                                        icon_class_name="swap_horiz"
                                        class_name="mr-2"
                                    />{" "}
                                    View Token
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const mobile_columns: ColumnDef<TokenV2Volume>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    className="mx-1"
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    className="mx-1"
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "contract_name",
            accessorKey: "contract_name",
            header: ({ column }) => (
                <TableHeaderSorting
                    align="left"
                    header_name={"Token"}
                    column={column}
                />
            ),
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-3">
                        <TokenAvatar
                            size={GRK_SIZES.EXTRA_SMALL}
                            token_url={row.original.logo_url}
                        />
                        <div className="flex flex-col">
                            <label className="text-base">
                                {row.original.contract_name
                                    ? row.original.contract_name
                                    : "FIXME"}
                            </label>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "total_liquidity_quote",
            accessorKey: "total_liquidity_quote",
            header: ({ column }) => (
                <TableHeaderSorting
                    align="right"
                    header_name={"Liquidity"}
                    column={column}
                />
            ),
            cell: ({ row }) => {
                const valueFormatted = prettifyCurrency(
                    row.original.total_liquidity_quote
                );

                return <div className="text-right">{valueFormatted}</div>;
            },
        },
        {
            id: "total_volume_24h_quote",
            accessorKey: "total_volume_24h_quote",
            header: ({ column }) => (
                <TableHeaderSorting
                    align="right"
                    header_name={"Volume (24hrs)"}
                    column={column}
                />
            ),
            cell: ({ row }) => {
                const valueFormatted = prettifyCurrency(
                    row.original.total_volume_24h_quote
                );

                return <div className="text-right">{valueFormatted}</div>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="ml-auto  ">
                                    <span className="sr-only">Open menu</span>
                                    <IconWrapper icon_class_name="expand_more" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => {
                                        if (on_token_click) {
                                            on_token_click(
                                                row.original.contract_address
                                            );
                                        }
                                    }}
                                >
                                    <IconWrapper
                                        icon_class_name="swap_horiz"
                                        class_name="mr-2"
                                    />{" "}
                                    View Token
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: maybeResult.match({
            None: () => [],
            Some: (result) => result,
        }),
        columns: windowWidth < 700 ? mobile_columns : columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            rowSelection,
        },
    });

    const body = maybeResult.match({
        None: () => (
            <TableRow>
                <TableCell className="h-12 text-center"></TableCell>
                <TableCell className="h-12 text-right">
                    <div className="float-left">
                        <Skeleton size={GRK_SIZES.LARGE} />
                    </div>
                </TableCell>
                <TableCell className="h-12 text-right">
                    <div className="float-right">
                        <Skeleton size={GRK_SIZES.LARGE} />
                    </div>
                </TableCell>
                <TableCell className="h-12 text-right">
                    <div className="float-right">
                        <Skeleton size={GRK_SIZES.LARGE} />
                    </div>
                </TableCell>
                <TableCell className="h-12 text-right">
                    <div className="float-right">
                        <Skeleton size={GRK_SIZES.LARGE} />
                    </div>
                </TableCell>
                <TableCell className="h-12 text-right">
                    <div className="float-right">
                        <Skeleton size={GRK_SIZES.LARGE} />
                    </div>
                </TableCell>
            </TableRow>
        ),
        Some: () =>
            error.error ? (
                <TableRow>
                    <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                    >
                        {error.error_message}
                    </TableCell>
                </TableRow>
            ) : !error.error && table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                    >
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                    >
                        No results.
                    </TableCell>
                </TableRow>
            ),
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap place-content-between gap-2">
                {/* <AccountCardView address={address} /> */}
                <div className="w-full rounded border p-2 md:max-w-[15rem] lg:max-w-[15rem]">
                    <h2 className="text-md text-secondary">Total Quote</h2>
                    <div className="flex items-end gap-2">
                        <span className="text-base">
                            {maybeResult.match({
                                None: () => (
                                    <Skeleton size={GRK_SIZES.MEDIUM} />
                                ),
                                Some: (result) => {
                                    const s = sum(result.map((x) => x.quote));
                                    return (
                                        <span>
                                            {prettifyCurrency(
                                                s,
                                                2,
                                                "USD",
                                                true
                                            )}
                                        </span>
                                    );
                                },
                            })}
                        </span>
                        <span className="flex text-sm text-secondary">
                            {maybeResult.match({
                                None: () => (
                                    <Skeleton
                                        size={GRK_SIZES.EXTRA_EXTRA_SMALL}
                                    />
                                ),
                                Some: (result) => {
                                    return (
                                        <span>({result.length} Tokens)</span>
                                    );
                                },
                            })}
                        </span>
                    </div>
                </div>
            </div>

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>{body}</TableBody>
            </Table>
        </div>
    );
};

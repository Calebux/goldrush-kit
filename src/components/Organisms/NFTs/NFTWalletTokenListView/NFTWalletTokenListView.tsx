import {
    GRK_SIZES,
    allowedCacheChains,
} from "@/utils/constants/shared.constants";
import { type Option, Some, None } from "@/utils/option";
import type { ChainItem } from "@covalenthq/client-sdk";
import covalentAvatar from "../../../../static/image 24.png";
import {
    prettifyCurrency,
    type NftTokenContractBalanceItem,
} from "@covalenthq/client-sdk";
import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import flatMap from "lodash/flatMap";
import sum from "lodash/sum";
import { AccountCard } from "@/components/Molecules/AccountCard/AccountCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCovalent } from "@/utils/store/Covalent";
import { type NFTWalletTokenListViewProps } from "@/utils/types/organisms.types";
import { TokenAvatar } from "@/components/Atoms/TokenAvatar/TokenAvatar";

export const NFTWalletTokenListView: React.FC<NFTWalletTokenListViewProps> = ({
    chain_names,
    address,
    onMint,
}) => {
    const [maybeResult, setResult] =
        useState<Option<NftTokenContractBalanceItem[]>>(None);
    const { covalentClient } = useCovalent();
    const [error, setError] = useState({ error: false, error_message: "" });
    const [allChains, setAllChains] = useState<Option<ChainItem[]>>(None);

    const handleAllChains = async () => {
        const allChainsResp = await covalentClient.BaseService.getAllChains();
        setAllChains(new Some(allChainsResp.data.items));
    };

    const handleNftsToken = async () => {
        setResult(None);
        const promises = chain_names.map(async (chain) => {
            const cache = !allowedCacheChains.includes(chain);
            let response;
            try {
                response = await covalentClient.NftService.getNftsForAddress(
                    chain,
                    address.trim(),
                    {
                        withUncached: cache,
                    }
                );

                setError({ error: false, error_message: "" });
                return response.data.items
                    .filter((o) => o.contract_name === "Alchemist 4.0")
                    .map((o) => {
                        return { ...o, chain };
                    });
            } catch (error) {
                console.error(`Error fetching balances for ${chain}:`, error);
                setError({
                    error: response ? response.error : false,
                    error_message: response ? response.error_message : "",
                });
                return [];
            }
        });

        const results = await Promise.all(promises);
        setResult(new Some(results.flat()));
    };

    useEffect(() => {
        handleAllChains();
        handleNftsToken();
    }, [chain_names, address]);

    return (
        <div className="space-y-4 ">
            <div className="flex flex-wrap place-content-between gap-2"></div>

            <div className="mt-6 grid grid-cols-[1fr_1fr_1fr_1fr] gap-x-5 gap-y-6">
                {maybeResult.match({
                    None: () =>
                        [1, 2, 3, 4, 5, 6, 7, 8].map((o, i) => {
                            return (
                                <Skeleton
                                    key={i}
                                    isNFT
                                    size={GRK_SIZES.EXTRA_EXTRA_SMALL}
                                />
                            );
                        }),
                    Some: (result: any) => {
                        if (error.error) {
                            return <>{error.error_message}</>;
                        } else if (!error.error && result.length === 0) {
                            return <>No results</>;
                        } else if (result.length > 0) {
                            return result.map((items: any) => {
                                return flatMap(items.nft_data, (it) => {
                                    return allChains.match({
                                        None: () => <></>,
                                        Some: (chains) => {
                                            const chain: ChainItem =
                                                chains.filter(
                                                    (o) =>
                                                        o.name === items.chain
                                                )[0];
                                            const chainColor =
                                                chain.color_theme.hex;
                                            const isDarkMode =
                                                document.documentElement.classList.contains(
                                                    "dark"
                                                );
                                            return (
                                                <div className="nft-card relative h-[420px] rounded-[5px] border-[0.5px] border-[#C4C4C4] p-[10px]">
                                                    <img
                                                        src={
                                                            it.external_data
                                                                ?.image_512
                                                                ? it
                                                                      .external_data
                                                                      .image_512
                                                                : "https://www.datocms-assets.com/86369/1685489960-nft.svg"
                                                        }
                                                        className="h-full w-full rounded-sm object-cover"
                                                        alt=""
                                                    />
                                                    <div className="absolute bottom-[10px] left-[10px] right-[10px] rounded-e-sm bg-[#0D0E2E] !bg-opacity-90  text-white dark:bg-[#0D0D0D] dark:bg-opacity-90">
                                                        <div className="p-2">
                                                            <div className="flex items-center gap-x-2 text-[10px] font-extrabold leading-6 ">
                                                                <img
                                                                    src={
                                                                        covalentAvatar
                                                                    }
                                                                    alt=""
                                                                />
                                                                <h4>
                                                                    Covalent
                                                                </h4>
                                                            </div>
                                                            <div className="mt-1 flex items-center justify-between">
                                                                <h2 className="text-base font-bold leading-6">
                                                                    {
                                                                        it
                                                                            .external_data
                                                                            .name
                                                                    }
                                                                </h2>
                                                                <h4 className="flex items-center gap-x-[5px] text-xs font-normal leading-6">
                                                                    +3
                                                                </h4>
                                                            </div>
                                                            <div className="mt-2 flex items-center justify-between text-xs font-normal leading-6">
                                                                <h2 className="leading-4">
                                                                    Mint start
                                                                </h2>
                                                                <h4 className="">
                                                                    26 Jan 2024
                                                                </h4>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="mint-btn hidden w-full cursor-pointer items-center justify-center bg-white py-[10px] text-center text-xs font-semibold leading-6 text-[#0D0D0D] dark:bg-[#0A0A23] dark:text-white"
                                                            onClick={() =>
                                                                onMint(it)
                                                            }
                                                        >
                                                            Mint now
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    });
                                });
                            });
                        }
                    },
                })}
            </div>
        </div>
    );
};

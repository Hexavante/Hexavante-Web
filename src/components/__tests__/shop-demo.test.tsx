import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SHOP_CATALOG } from "@/lib/shop-catalog";
import { shopItemIcon } from "@/lib/shop-item-icons";
import { SHOP_CATEGORY_ICONS } from "@/lib/shop-ui";
import { ShopTabs } from "../shop/shop-tabs";
import { ShopCoinHistory } from "../shop/shop-coin-history";
import type { ShopItemView } from "@/services/shop.service";
vi.mock("@/app/actions/shop", () => ({equipItemAction: vi.fn(), purchaseItemAction: vi.fn()}));
vi.mock("@/app/actions/premium", () => ({activatePremiumTrialAction: vi.fn()}));
it("atribui um símbolo próprio a cada item do catálogo e aceita itens antigos", () => {
  expect(new Set(SHOP_CATALOG.map(shopItemIcon)).size).toBe(SHOP_CATALOG.length);
  expect(shopItemIcon({slug:"legado", category:"TITLE"})).toBe(SHOP_CATEGORY_ICONS.TITLE);
});
it("acha itens sem acento, informa busca vazia e restaura a lista",()=>{
  const items = SHOP_CATALOG.filter(i=>["title-filosofo","title-analista"].includes(i.slug)).map(i=>({...i,id:i.slug,ownershipStatus:"available",isPermanent:true})) as ShopItemView[];
  render(<ShopTabs items={items} inventory={[]} coins={0} premium={null} activeBooster={false} coinMultiplier={1}/>);
  const input=screen.getByRole("searchbox");
  fireEvent.change(input,{target:{value:"filosofo"}});
  expect(screen.getByRole("heading",{name:"Filósofo"})).toBeInTheDocument();
  expect(screen.queryByRole("heading",{name:"Analista"})).toBeNull();
  fireEvent.change(input,{target:{value:"xxx"}});
  expect(screen.getByText("Nenhum item corresponde à busca.")).toBeInTheDocument();
  fireEvent.change(input,{target:{value:""}});
  expect(screen.getByRole("heading",{name:"Analista"})).toBeInTheDocument();
});
it("exibe compras antigas e novas como saídas e ganhos como entradas",()=>{
  const base={id:"1",userId:"test",source:"SHOP_PURCHASE" as const, sourceId:"a",createdAt:new Date(),description:"Compra"};
  render(<ShopCoinHistory transactions={[
    {...base,type:"SPEND",amount:200},{...base,id:"2",type:"SPEND",amount:-150},
    {...base,id:"3",type:"EARN",source:"LESSON",amount:3}
  ]}/>);
  for (const label of ["−200","−150","+3"]) expect(screen.getByText(label)).toBeInTheDocument();
});

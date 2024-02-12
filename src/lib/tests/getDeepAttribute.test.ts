import test from "ava";
import { getDeepAttribute } from "../themeManager.ts";

test("getDeepAttribute", t => {
    const a = { deep1: { deep2: "hi" } };
    const b = { deep1: { deep2: { deep3: "hu" }, ho: "ho" } };

    t.is(getDeepAttribute(a, ["deep1", "deep2"]), "hi");
    t.is(getDeepAttribute(b, ["deep1", "ho"]), "ho");
    t.is(getDeepAttribute(b, ["deep1", "deep2", "deep3"]), "hu");
    t.deepEqual(getDeepAttribute(b, ["deep1", "deep2"]), { deep3: "hu" });
    t.is(getDeepAttribute({}, ["not_existing"]), null);
});

test("getDeepAttribute with var", t => {
    const b = { deep1: { deep2: { deep3: "$$deep1.ho" }, ho: "ho" } };

    t.is(getDeepAttribute(b, ["deep1", "ho"]), "ho");
    t.is(getDeepAttribute(b, ["deep1", "deep2", "deep3"]), "ho");
});

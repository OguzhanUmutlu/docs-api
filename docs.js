(async () => {
    const style = document.createElement("style");
    style.innerHTML = `.description,.navbar,.page-html{position:absolute;top:0}.navbar>.title,h1,h2,h3,h4,h5,h6{text-align:center}*{user-select:none;font-family:Arial,serif}body{--bg:#36393F;--bg-l-l-l:#7c7d81;--bg-l-l:#6c6f77;--bg-l:#595d67;--bg-d:#2a2c2f;--c:white;background-color:var(--bg);color:var(--c);overflow:hidden}.navbar{left:0;width:20%;height:100%;min-width:fit-content;background-color:var(--bg-l)}.navbar>.title{margin-top:10px;font-size:20px;cursor:pointer;transition:transform .2s ease-in-out}.navbar>.title:hover{transform:scale(1.1)}.navbar>.content{margin-top:30px}.page{padding:5px 20px;background-color:var(--bg-l-l);cursor:pointer;transition:.2s ease-in-out;white-space:nowrap}.description,pre{background-color:var(--bg-d)}.page:hover{background-color:var(--bg-l-l-l);transform:scale(1.05);translate:10px;box-shadow:10px 10px 10px rgba(0,0,0,.2)}.page-closed{margin-top:-28px}.page>svg{position:absolute;right:10px;margin-top:-3px}.description{left:0;width:fit-content;height:30px;padding:10px 10px 0;border-radius:8px;opacity:0;pointer-events:none;transition:opacity .3s ease-in-out;z-index:1000}.description-on{opacity:.8}.page-html{left:25%;width:70%;height:100%;overflow:auto}::-webkit-scrollbar{width:10px}::-webkit-scrollbar-track{background:#f1f1f1}::-webkit-scrollbar-thumb{background:#888}::-webkit-scrollbar-thumb:hover{background:#555}pre{position:relative;border-radius:6px;padding:15px}.language-js{color:#7c7d81;font-family:monospace,serif;user-select:all}.language-js>.js-if{color:#ab77ae}.language-js>.js-var{color:#d07945}.language-js>.js-str{color:#8abd75}.language-js>.js-num{color:#d85348}`;
    if (document.head) document.head.appendChild(style);
    /*** @type {{label: string, _open?: boolean, id?: string, html?: string, markdown?: boolean, pages: ({type: "page", label: string} | {type: "category", _open?: boolean, label: string, pages: ({type: "page", label: string} | {type: "category", label: string, pages: ({type: "page", label: string} | {type: "category", label: string, pages: ({type: "page", label: string} | {type: "category", label: string, pages: Array})[]})[]})[]})[]}} */
    const DOCS = await (await fetch("./docs.json")).json();
    //todo: animations on page navbar, changing page transition like a transition that translates pages from left to right and configurable
    const ORIGINAL_PAD = 30;
    const STEP_PAD = 15;
    const setURL = url => window.history.pushState({}, null, url);
    const setPage = page => {
        const query = new URLSearchParams(location.href);
        query.set("page", page);
        setURL(Array.from(query).map(i => `${encodeURI(i[0])}=${encodeURI(i[1])}`).join("&"));
    };
    const loadPage = async page => {
        if (page === DOCS && !page.pages) throw new Error("Couldn't find the 'pages' property of 'docs.json'!");
        if (!page.label) throw new Error("Couldn't find the 'label' property of a documentation page!")
        if (page.pages) for (let i = 0; i < page.pages.length; i++) await loadPage(page.pages[i]);
        if (page.href) page.html = await (await fetch(page.href)).text();
    };
    await loadPage(DOCS);
    const desc = () => document.querySelector(".description");
    const getAllPages = () => {
        let pages = [];
        const count = (page, sub = 0, parent = null) => {
            page._parent = parent;
            page._sub = sub;
            pages.push(page);
            (page.pages || []).forEach(i => count(i, sub + 1, page));
        };
        count(DOCS);
        return pages;
    };
    DOCS._open = true;
    const setPageHTML = page => {
        if (page.html) {
            const pageHtml = document.querySelector(".page-html");
            pageHtml.innerHTML = page.markdown ? marked.parse(page.html) : page.html;
            pageHtml.querySelectorAll("code").forEach(c => {
                const _lang = Array.from(c.classList).find(i => i.startsWith("language-"));
                if (!_lang) return;
                const lang = _lang.substring(9);
                if (lang === "js") {
                    const text = c.textContent;
                    let str = null;
                    let comment = "";//todo: comments
                    let m = "";
                    let mn = [];
                    let cnc = {};
                    for (let i = 0; i < text.length; i++) {
                        const c = text[i];
                        if (c === "\\") cnc[i + 1] = true;
                        const cn = cnc[i];
                        if (str && !cn) {
                            if (c === str) {
                                str = null;
                                mn.push(m + c);
                                m = "";
                            } else m += c;
                        } else if ((c === "\"" || c === "'" || c === "`") && !cn) {
                            str = c;
                            mn.push(m);
                            m = c;
                        } else m += c;
                    }
                    if (m) mn.push(m);
                    const mnP = [];
                    mn.forEach(i => {
                        if ([..."\"'`"].some(j => i.startsWith(j))) {
                            mnP.push({type: "str", str: i});
                        } else {
                            i = i + " ";
                            let v = null;
                            let n = null;
                            for (let k = 0; k < i.length; k++) {
                                const c = i[k];
                                if (v) {
                                    if (!/[a-zA-Z$_\d]/.test(c)) {
                                        mnP.push({
                                            type: ["if", "else", "const", "switch", "var", "let", "for", "while", "do", "return", "function"].some(i => v.trim() === i) ? "if" : "var",
                                            str: v
                                        });
                                        v = null;
                                        if (k !== i.length - 1) mnP.push({str: c});
                                    } else v += c;
                                } else if (n) {
                                    //todo: big-ints, e+N
                                    if (!/\d/.test(c)) {
                                        mnP.push({type: "num", str: n});
                                        n = null;
                                        if (k !== i.length - 1) mnP.push({str: c});
                                    } else n += c;
                                } else {
                                    if (/[a-zA-Z$_]/.test(c)) {
                                        v = c;
                                    } else if (/\d/.test(c)) {
                                        n = c;
                                    } else if (k !== i.length - 1) mnP.push({str: c});
                                }
                            }
                        }
                    });
                    c.innerHTML = "";
                    mnP.forEach(i => {
                        const div = document.createElement("span");
                        if (i.type) div.classList.add("js-" + i.type);
                        div.textContent = i.str;
                        c.appendChild(div);
                    });
                }
            });
        }
    };
    let _id = 0;
    /**
     * @param {Object} page
     * @returns {HTMLDivElement}
     */
    const parsePage = page => {
        if (!page._div) {
            page._id = _id++;
            const div = document.createElement("div");
            div.classList.add("page");
            div.style.paddingLeft = ((page._sub - 1) * STEP_PAD + ORIGINAL_PAD) + "px";
            div.style.paddingRight = ORIGINAL_PAD + "px";
            if (page.description) {
                div.addEventListener("mouseover", () => {
                    desc().innerText = page.description;
                    desc().classList.add("description-on");
                });
                div.addEventListener("mouseleave", () => desc().classList.remove("description-on"));
            }
            div.addEventListener("click", () => {
                if (page.id) setPage(page.id);
                setPageHTML(page);
                if (page.pages) {
                    page._open = !page._open;
                    reload();
                }
            });
            div.innerText = page.label;
            if (page.pages) {
                div.innerHTML = div.innerHTML + "<svg width='16' height='16'><path d='M0 16 L8 6 L16 16 L0 16 Z' fill='var(--bg-d)'></svg>";
                page._open = false;
            }
            div.style.position = "relative";
            div.style.zIndex = 1000 - page._sub + "";
            page._div = div;
            page._parent = parent;
        } else {
            if (page.pages) {
                const path = page._div.querySelector("svg > path");
                path.setAttribute("d", page._open ? "M0 6 L8 16 L16 6 L0 6 Z" : "M0 16 L8 6 L16 16 L0 16 Z");
            }
        }
        const allParents = [];
        let _p = page;
        while (_p._parent) allParents.push(_p = _p._parent);
        page._div.classList[allParents.every(i => i._open) ? "remove" : "add"]("page-closed");
        return page._div;
    };
    addEventListener("mousemove", ev => {
        desc().style.left = ev.clientX + 15 + "px";
        desc().style.top = ev.clientY - 7 + "px";
    });
    document.body.innerHTML = `<div class="navbar"><div class="title">${DOCS.label}</div><div class="content"></div></div><div class="page-html"></div><div class="description"></div>`;
    if (!document.head) document.body.appendChild(style);
    document.querySelector(".navbar > .title").addEventListener("click", () => {
        if (DOCS.id) setPage(DOCS.id);
        if (DOCS.html) setPageHTML(DOCS);
    });
    const markedScript = document.createElement("script");
    document.body.appendChild(markedScript);
    markedScript.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    await new Promise(r => markedScript.addEventListener("load", r));
    const reload = () => {
        const content = document.querySelector(".navbar > .content");
        content.innerHTML = "";
        /*** @type {HTMLDivElement[]} */
        const nodes = getAllPages().filter(i => i !== DOCS).map(i => parsePage(i));
        nodes.forEach(e => content.appendChild(e));
    };
    reload();
    reload();
    window.rel = reload;
    const queryPage = new URLSearchParams(location.href).get("page") || DOCS.id;
    const page = getAllPages().find(i => i.id === queryPage);
    window.DOCS = DOCS;
    if (page) setPageHTML(page);
    addEventListener("contextmenu", ev => ev.preventDefault());
    addEventListener("keydown", ev => ev.key === "F12" && ev.preventDefault());
})();

(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\CaixaDeIcones.svelte generated by Svelte v3.48.0 */

    const file$3 = "src\\CaixaDeIcones.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let a0;
    	let i0;
    	let t;
    	let a1;
    	let i1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t = space();
    			a1 = element("a");
    			i1 = element("i");
    			attr_dev(i0, "class", "icone fa fa-envelope svelte-4f3ovm");
    			attr_dev(i0, "aria-hidden", "true");
    			add_location(i0, file$3, 2, 8, 96);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "mailto:marcospanace1984@gmail.com");
    			add_location(a0, file$3, 1, 4, 26);
    			attr_dev(i1, "class", "icone fa fa-instagram svelte-4f3ovm");
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file$3, 5, 8, 238);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://instagram.com/marcospanace84");
    			add_location(a1, file$3, 4, 4, 165);
    			attr_dev(div, "class", "icones svelte-4f3ovm");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(a0, i0);
    			append_dev(div, t);
    			append_dev(div, a1);
    			append_dev(a1, i1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CaixaDeIcones', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CaixaDeIcones> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CaixaDeIcones extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CaixaDeIcones",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Capa.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\Capa.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let t2;
    	let h2;
    	let t4;
    	let caixadeicones;
    	let current;
    	caixadeicones = new CaixaDeIcones({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Marcos";
    			t2 = space();
    			h2 = element("h2");
    			h2.textContent = "Software Developer";
    			t4 = space();
    			create_component(caixadeicones.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = "./imagem/foto.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Foto Marcos");
    			attr_dev(img, "class", "foto svelte-kjht5d");
    			add_location(img, file$2, 6, 8, 135);
    			attr_dev(h1, "class", "titulo svelte-kjht5d");
    			add_location(h1, file$2, 7, 8, 207);
    			attr_dev(h2, "calss", "descricao");
    			add_location(h2, file$2, 8, 8, 248);
    			attr_dev(div0, "class", "centro svelte-kjht5d");
    			add_location(div0, file$2, 5, 4, 105);
    			attr_dev(div1, "class", "fundo svelte-kjht5d");
    			add_location(div1, file$2, 4, 0, 80);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			append_dev(div0, t2);
    			append_dev(div0, h2);
    			append_dev(div0, t4);
    			mount_component(caixadeicones, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(caixadeicones.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(caixadeicones.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(caixadeicones);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Capa', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Capa> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ CaixaDeIcones });
    	return [];
    }

    class Capa extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Capa",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Secao.svelte generated by Svelte v3.48.0 */

    const file$1 = "src\\Secao.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let h1;
    	let t0;
    	let t1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			t0 = text(/*titulo*/ ctx[0]);
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "class", "titulo svelte-9gknhx");
    			add_location(h1, file$1, 6, 4, 155);
    			attr_dev(section, "class", "secao svelte-9gknhx");
    			toggle_class(section, "centralizar", /*centralizartexto*/ ctx[1]);
    			add_location(section, file$1, 5, 0, 89);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h1);
    			append_dev(h1, t0);
    			append_dev(section, t1);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*titulo*/ 1) set_data_dev(t0, /*titulo*/ ctx[0]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*centralizartexto*/ 2) {
    				toggle_class(section, "centralizar", /*centralizartexto*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Secao', slots, ['default']);
    	let { titulo } = $$props;
    	let { centralizartexto = false } = $$props;
    	const writable_props = ['titulo', 'centralizartexto'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Secao> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('titulo' in $$props) $$invalidate(0, titulo = $$props.titulo);
    		if ('centralizartexto' in $$props) $$invalidate(1, centralizartexto = $$props.centralizartexto);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ titulo, centralizartexto });

    	$$self.$inject_state = $$props => {
    		if ('titulo' in $$props) $$invalidate(0, titulo = $$props.titulo);
    		if ('centralizartexto' in $$props) $$invalidate(1, centralizartexto = $$props.centralizartexto);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [titulo, centralizartexto, $$scope, slots];
    }

    class Secao extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { titulo: 0, centralizartexto: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Secao",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*titulo*/ ctx[0] === undefined && !('titulo' in props)) {
    			console.warn("<Secao> was created without expected prop 'titulo'");
    		}
    	}

    	get titulo() {
    		throw new Error("<Secao>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set titulo(value) {
    		throw new Error("<Secao>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get centralizartexto() {
    		throw new Error("<Secao>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set centralizartexto(value) {
    		throw new Error("<Secao>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    // (8:0) <Secao titulo="Sobre mim" centralizartexto={true}>
    function create_default_slot_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Sou analista e desenvolvedor de software e um amante do mundo da\n\t\ttecnologia.";
    			add_location(p, file, 8, 1, 154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(8:0) <Secao titulo=\\\"Sobre mim\\\" centralizartexto={true}>",
    		ctx
    	});

    	return block;
    }

    // (14:0) <Secao titulo="Formação" centralizartexto={false}>
    function create_default_slot_2(ctx) {
    	let p;
    	let strong;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Cursando Analise e Desenvolvimento de Sistema no Instituto de Federal de\n\t\t\tSão Paulo Campus Campos do Jordão.";
    			add_location(strong, file, 15, 2, 312);
    			add_location(p, file, 14, 1, 306);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(14:0) <Secao titulo=\\\"Formação\\\" centralizartexto={false}>",
    		ctx
    	});

    	return block;
    }

    // (23:0) <Secao titulo="Objetivo">
    function create_default_slot_1(ctx) {
    	let p;
    	let strong;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Fazer parte da equipe contribuindo com crescimento da empresa e elevar\n\t\t\tmeus conhecimentos na área.";
    			add_location(strong, file, 24, 2, 496);
    			add_location(p, file, 23, 1, 490);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(23:0) <Secao titulo=\\\"Objetivo\\\">",
    		ctx
    	});

    	return block;
    }

    // (32:0) <Secao titulo="Experiencia">
    function create_default_slot(ctx) {
    	let h2;
    	let t1;
    	let span;
    	let t3;
    	let ul;
    	let li;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "INATEL";
    			t1 = space();
    			span = element("span");
    			span.textContent = "backand";
    			t3 = space();
    			ul = element("ul");
    			li = element("li");
    			li.textContent = "Exmplos\n\t\t\tExemplo";
    			add_location(h2, file, 32, 1, 668);
    			add_location(span, file, 33, 1, 686);
    			add_location(li, file, 35, 2, 716);
    			add_location(ul, file, 34, 1, 709);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(32:0) <Secao titulo=\\\"Experiencia\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let capa;
    	let t0;
    	let secao0;
    	let t1;
    	let secao1;
    	let t2;
    	let secao2;
    	let t3;
    	let secao3;
    	let t4;
    	let rodape;
    	let current;
    	capa = new Capa({ $$inline: true });

    	secao0 = new Secao({
    			props: {
    				titulo: "Sobre mim",
    				centralizartexto: true,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	secao1 = new Secao({
    			props: {
    				titulo: "Formação",
    				centralizartexto: false,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	secao2 = new Secao({
    			props: {
    				titulo: "Objetivo",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	secao3 = new Secao({
    			props: {
    				titulo: "Experiencia",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(capa.$$.fragment);
    			t0 = space();
    			create_component(secao0.$$.fragment);
    			t1 = space();
    			create_component(secao1.$$.fragment);
    			t2 = space();
    			create_component(secao2.$$.fragment);
    			t3 = space();
    			create_component(secao3.$$.fragment);
    			t4 = space();
    			rodape = element("rodape");
    			add_location(rodape, file, 41, 0, 761);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(capa, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(secao0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(secao1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(secao2, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(secao3, target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, rodape, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const secao0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao0_changes.$$scope = { dirty, ctx };
    			}

    			secao0.$set(secao0_changes);
    			const secao1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao1_changes.$$scope = { dirty, ctx };
    			}

    			secao1.$set(secao1_changes);
    			const secao2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao2_changes.$$scope = { dirty, ctx };
    			}

    			secao2.$set(secao2_changes);
    			const secao3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao3_changes.$$scope = { dirty, ctx };
    			}

    			secao3.$set(secao3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(capa.$$.fragment, local);
    			transition_in(secao0.$$.fragment, local);
    			transition_in(secao1.$$.fragment, local);
    			transition_in(secao2.$$.fragment, local);
    			transition_in(secao3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(capa.$$.fragment, local);
    			transition_out(secao0.$$.fragment, local);
    			transition_out(secao1.$$.fragment, local);
    			transition_out(secao2.$$.fragment, local);
    			transition_out(secao3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(capa, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(secao0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(secao1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(secao2, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(secao3, detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(rodape);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Capa, Secao });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({target: document.body});

    return app;

})();
//# sourceMappingURL=bundle.js.map

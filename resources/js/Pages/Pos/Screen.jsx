import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Monitor,
    Plus,
    Minus,
    Power,
    PowerOff,
    Clock,
    DollarSign,
    Warehouse,
    Building2,
    Landmark,
    Calendar,
    ArrowRight,
    ShoppingCart,
    AlertCircle,
    CheckCircle2,
    Search,
    Trash2,
    CreditCard,
    Banknote,
    Receipt,
    Printer,
    User as UserIcon,
    Smartphone,
    X,
    RotateCcw,
    Sliders,
    Tag,
    Maximize2,
    Percent,
} from 'lucide-react';

export default function PosScreen({
    openSession = null,
    branches = [],
    warehouses = [],
    treasuries = [],
    fiscalYears = [],
    customers = [],
    products = [],
    paymentMethods = [],
    categories = [],
    discounts = [],
    taxes = [],
    userCanDiscount = false,
    userCanOverrideMin = false,
}) {
    // -------------------------------------------------------------------------
    // Session Open Form State
    // -------------------------------------------------------------------------
    const {
        data: openData,
        setData: setOpenData,
        post: postOpen,
        processing: openProcessing,
        errors: openErrors,
    } = useForm({
        branch_id:       branches[0]?.id || '',
        warehouse_id:    warehouses[0]?.id || '',
        treasury_id:     treasuries[0]?.id || '',
        fiscal_year_id:  fiscalYears[0]?.id || '',
        opening_balance: '0',
        notes:           '',
    });

    const filteredWarehouses = openData.branch_id
        ? warehouses.filter(w => String(w.branch_id) === String(openData.branch_id))
        : warehouses;

    const filteredTreasuries = openData.branch_id
        ? treasuries.filter(t => String(t.branch_id) === String(openData.branch_id))
        : treasuries;

    const handleOpenSession = (e) => {
        e.preventDefault();
        postOpen('/sales/pos/open');
    };

    // -------------------------------------------------------------------------
    // POS Terminal State (When Session is Open)
    // -------------------------------------------------------------------------
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null); // null = walk-in cash customer
    const [cart, setCart] = useState([]);
    const [headerDiscountType, setHeaderDiscountType] = useState('none'); // 'none' | 'fixed' | 'percentage'
    const [headerDiscountValue, setHeaderDiscountValue] = useState(0);

    // Modals
    const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
    const [activeCartIndexForSerial, setActiveCartIndexForSerial] = useState(null);
    const [serialSearchQuery, setSerialSearchQuery] = useState('');

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentSplits, setPaymentSplits] = useState([]);
    const [tenderedCash, setTenderedCash] = useState('');
    const [posNotes, setPosNotes] = useState('');
    const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);

    // Completed Order / Receipt Print Modal
    const [completedOrder, setCompletedOrder] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    // Close Session Modal
    const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
    const [actualClosingBalance, setActualClosingBalance] = useState('');
    const [closingNotes, setClosingNotes] = useState('');
    const [isClosingSession, setIsClosingSession] = useState(false);
    const [closeError, setCloseError] = useState(null);

    const barcodeInputRef = useRef(null);

    // Focus barcode input on mount and reset
    useEffect(() => {
        if (openSession && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [openSession]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!openSession) return;

            // F2: Open Payment
            if (e.key === 'F2') {
                e.preventDefault();
                if (cart.length > 0) {
                    openPaymentModal();
                }
            }
            // F1: Reset Cart / New Sale
            if (e.key === 'F1') {
                e.preventDefault();
                resetCart();
            }
            // F3: Focus Search/Barcode
            if (e.key === 'F3') {
                e.preventDefault();
                if (barcodeInputRef.current) barcodeInputRef.current.focus();
            }
            // Esc: Close active modal
            if (e.key === 'Escape') {
                setIsSerialModalOpen(false);
                setIsPaymentModalOpen(false);
                setIsReceiptModalOpen(false);
                setIsCloseSessionModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openSession, cart]);

    // -------------------------------------------------------------------------
    // Products Filtering & Catalog
    // -------------------------------------------------------------------------
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
            const query = searchQuery.trim().toLowerCase();
            const matchesQuery = !query ||
                p.name.toLowerCase().includes(query) ||
                (p.sku && p.sku.toLowerCase().includes(query)) ||
                (p.barcode && p.barcode.toLowerCase().includes(query)) ||
                (p.available_serials && p.available_serials.some(s =>
                    s.serial_number?.toLowerCase().includes(query) ||
                    s.imei1?.toLowerCase().includes(query) ||
                    s.imei2?.toLowerCase().includes(query)
                ));
            return matchesCategory && matchesQuery;
        });
    }, [products, selectedCategory, searchQuery]);

    // -------------------------------------------------------------------------
    // Cart Actions
    // -------------------------------------------------------------------------
    const addToCart = (product, specificSerial = null) => {
        const isSerial = product.tracking_type === 'serial';
        const availableStock = Number(product.stock_balance) || 0;

        // Check if already in cart
        const existingIndex = cart.findIndex(item => item.product.id === product.id);

        if (existingIndex > -1) {
            const currentItem = cart[existingIndex];
            if (isSerial) {
                // Check if we reached available serial count
                const availableSerialsCount = product.available_serials?.length || 0;
                if (currentItem.quantity >= availableSerialsCount) {
                    alert(`لا تتوفر أجهزة إضافية في المستودع لهذا المنتج (${availableSerialsCount} فقط).`);
                    return;
                }
                const newQty = currentItem.quantity + 1;
                let newSerials = [...currentItem.selectedSerials];
                if (specificSerial && !newSerials.includes(specificSerial.id)) {
                    newSerials.push(specificSerial.id);
                }
                const updatedCart = [...cart];
                updatedCart[existingIndex] = {
                    ...currentItem,
                    quantity: newQty,
                    selectedSerials: newSerials,
                };
                setCart(updatedCart);
            } else {
                if (currentItem.quantity + 1 > availableStock) {
                    alert(`الكمية المطلوبة تتجاوز الرصيد المتاح (${availableStock}).`);
                    return;
                }
                const updatedCart = [...cart];
                updatedCart[existingIndex] = {
                    ...currentItem,
                    quantity: currentItem.quantity + 1,
                };
                setCart(updatedCart);
            }
        } else {
            // New item in cart
            if (availableStock <= 0 && isSerial) {
                alert('هذا المنتج غير متوفر حالياً في مستودع نقطة البيع.');
                return;
            }

            const initialSerials = specificSerial ? [specificSerial.id] : [];
            const taxRate = product.tax ? Number(product.tax.rate) : 15; // default 15% VAT

            setCart([...cart, {
                product,
                quantity: 1,
                unitPrice: Number(product.selling_price) || 0,
                minPrice: Number(product.min_selling_price) || 0,
                discountType: 'none',
                discountValue: 0,
                taxRate,
                selectedSerials: initialSerials,
            }]);
        }
    };

    const updateQuantity = (index, delta) => {
        const item = cart[index];
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            removeFromCart(index);
            return;
        }

        const isSerial = item.product.tracking_type === 'serial';
        const availableStock = Number(item.product.stock_balance) || 0;

        if (isSerial) {
            const availableSerialsCount = item.product.available_serials?.length || 0;
            if (newQty > availableSerialsCount) {
                alert(`الأجهزة المتوفرة في المستودع ${availableSerialsCount} فقط.`);
                return;
            }
            // Trim serials if reduced
            const updatedSerials = item.selectedSerials.slice(0, newQty);
            const updatedCart = [...cart];
            updatedCart[index] = { ...item, quantity: newQty, selectedSerials: updatedSerials };
            setCart(updatedCart);
        } else {
            if (newQty > availableStock) {
                alert(`الرصيد المتاح في المستودع هو ${availableStock}.`);
                return;
            }
            const updatedCart = [...cart];
            updatedCart[index] = { ...item, quantity: newQty };
            setCart(updatedCart);
        }
    };

    const updateUnitPrice = (index, newPrice) => {
        const item = cart[index];
        const priceNum = Number(newPrice) || 0;
        if (priceNum < item.minPrice && !userCanOverrideMin) {
            alert(`السعر المحدد أقل من الحد الأدنى (${item.minPrice} ر.س) وليس لديك صلاحية التجاوز.`);
            return;
        }
        const updatedCart = [...cart];
        updatedCart[index] = { ...item, unitPrice: priceNum };
        setCart(updatedCart);
    };

    const updateLineDiscount = (index, type, val) => {
        if (!userCanDiscount && Number(val) > 0) {
            alert('ليس لديك صلاحية تطبيق الخصم.');
            return;
        }
        const updatedCart = [...cart];
        updatedCart[index] = { ...cart[index], discountType: type, discountValue: Number(val) || 0 };
        setCart(updatedCart);
    };

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const resetCart = () => {
        setCart([]);
        setHeaderDiscountType('none');
        setHeaderDiscountValue(0);
        setSelectedCustomer(null);
        setCheckoutError(null);
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
    };

    // Fast Barcode / Serial Scan Handler
    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        const code = searchQuery.trim();
        if (!code) return;

        // 1. Try to find serial matching code
        for (const prod of products) {
            if (prod.tracking_type === 'serial' && prod.available_serials) {
                const foundSerial = prod.available_serials.find(s =>
                    s.serial_number?.toLowerCase() === code.toLowerCase() ||
                    s.imei1 === code ||
                    s.imei2 === code
                );
                if (foundSerial) {
                    addToCart(prod, foundSerial);
                    setSearchQuery('');
                    return;
                }
            }
        }

        // 2. Try to find product by barcode or SKU
        const matchedProduct = products.find(p =>
            p.barcode?.toLowerCase() === code.toLowerCase() ||
            p.sku?.toLowerCase() === code.toLowerCase()
        );

        if (matchedProduct) {
            addToCart(matchedProduct);
            setSearchQuery('');
        }
    };

    // -------------------------------------------------------------------------
    // Serial Selection Modal Logic
    // -------------------------------------------------------------------------
    const openSerialModal = (cartIndex) => {
        setActiveCartIndexForSerial(cartIndex);
        setSerialSearchQuery('');
        setIsSerialModalOpen(true);
    };

    const toggleSerialSelection = (serialId) => {
        if (activeCartIndexForSerial === null) return;
        const item = cart[activeCartIndexForSerial];
        let newSelected = [...item.selectedSerials];

        if (newSelected.includes(serialId)) {
            newSelected = newSelected.filter(id => id !== serialId);
        } else {
            if (newSelected.length >= item.quantity) {
                alert(`تم تحديد عدد الأجهزة المطلوب بالفعل (${item.quantity}). لزيادة الأجهزة قم بزيادة كمية السطر.`);
                return;
            }
            newSelected.push(serialId);
        }

        const updatedCart = [...cart];
        updatedCart[activeCartIndexForSerial] = {
            ...item,
            selectedSerials: newSelected,
        };
        setCart(updatedCart);
    };

    // -------------------------------------------------------------------------
    // Financial Computations
    // -------------------------------------------------------------------------
    const { subtotal, totalLineDiscounts, headerDiscountAmount, taxTotal, grandTotal } = useMemo(() => {
        let sub = 0;
        let lineDisc = 0;
        let tax = 0;

        cart.forEach(item => {
            const rawLineTotal = item.unitPrice * item.quantity;
            let lineDiscountAmt = 0;
            if (item.discountType === 'percentage') {
                lineDiscountAmt = (rawLineTotal * item.discountValue) / 100;
            } else if (item.discountType === 'fixed') {
                lineDiscountAmt = item.discountValue;
            }
            lineDiscountAmt = Math.min(lineDiscountAmt, rawLineTotal);

            const netLineTotal = rawLineTotal - lineDiscountAmt;
            const lineTax = (netLineTotal * item.taxRate) / 100;

            sub += rawLineTotal;
            lineDisc += lineDiscountAmt;
            tax += lineTax;
        });

        // Header discount
        let headerDiscAmt = 0;
        const netAfterLineDisc = sub - lineDisc;
        if (headerDiscountType === 'percentage') {
            headerDiscAmt = (netAfterLineDisc * Number(headerDiscountValue)) / 100;
        } else if (headerDiscountType === 'fixed') {
            headerDiscAmt = Number(headerDiscountValue) || 0;
        }
        headerDiscAmt = Math.min(headerDiscAmt, netAfterLineDisc);

        const finalTotal = Math.max(0, netAfterLineDisc - headerDiscAmt + tax);

        return {
            subtotal: sub,
            totalLineDiscounts: lineDisc,
            headerDiscountAmount: headerDiscAmt,
            taxTotal: tax,
            grandTotal: finalTotal,
        };
    }, [cart, headerDiscountType, headerDiscountValue]);

    // -------------------------------------------------------------------------
    // Payment Modal & Multi-payment Settlement
    // -------------------------------------------------------------------------
    const openPaymentModal = () => {
        // Validation: verify serial counts match quantities
        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];
            if (item.product.tracking_type === 'serial') {
                if (item.selectedSerials.length !== item.quantity) {
                    alert(`المنتج "${item.product.name}" يتطلب اختيار ${item.quantity} رقم تسلسلي/IMEI (المحدد حالياً: ${item.selectedSerials.length}).`);
                    openSerialModal(i);
                    return;
                }
            }
        }

        // Initialize default payment split: Cash with grandTotal
        const defaultMethod = paymentMethods.find(m => m.type === 'cash') || paymentMethods[0];
        setPaymentSplits([{
            payment_method_id: defaultMethod?.id || '',
            amount: grandTotal.toFixed(2),
        }]);
        setTenderedCash(grandTotal.toFixed(2));
        setCheckoutError(null);
        setIsPaymentModalOpen(true);
    };

    const addPaymentSplit = () => {
        const usedMethodIds = paymentSplits.map(s => Number(s.payment_method_id));
        const nextMethod = paymentMethods.find(m => !usedMethodIds.includes(m.id)) || paymentMethods[0];

        const totalAssigned = paymentSplits.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const remainder = Math.max(0, grandTotal - totalAssigned);

        setPaymentSplits([...paymentSplits, {
            payment_method_id: nextMethod?.id || '',
            amount: remainder.toFixed(2),
        }]);
    };

    const removePaymentSplit = (idx) => {
        if (paymentSplits.length <= 1) return;
        setPaymentSplits(paymentSplits.filter((_, i) => i !== idx));
    };

    const updatePaymentSplit = (idx, field, val) => {
        const updated = [...paymentSplits];
        updated[idx] = { ...updated[idx], [field]: val };
        setPaymentSplits(updated);
    };

    const totalPaidInSplits = paymentSplits.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const splitDifference = grandTotal - totalPaidInSplits;

    const cashSplit = paymentSplits.find(s => {
        const m = paymentMethods.find(pm => String(pm.id) === String(s.payment_method_id));
        return m?.type === 'cash';
    });
    const changeDue = Math.max(0, (Number(tenderedCash) || 0) - (Number(cashSplit?.amount) || 0));

    // Fast Cash Buttons
    const handleQuickCash = (amount) => {
        setTenderedCash(String(amount));
    };

    // -------------------------------------------------------------------------
    // POS Checkout Execution
    // -------------------------------------------------------------------------
    const handleCheckout = async () => {
        setCheckoutError(null);

        // Check if on-credit payment requires a customer
        const creditSplit = paymentSplits.find(s => {
            const m = paymentMethods.find(pm => String(pm.id) === String(s.payment_method_id));
            return m?.type === 'credit';
        });

        if (creditSplit && Number(creditSplit.amount) > 0 && !selectedCustomer) {
            setCheckoutError('البيع الآجل يتطلب تحديد عميل مسجل في النظام.');
            return;
        }

        if (Math.abs(splitDifference) > 0.05) {
            setCheckoutError(`مجموع الدفعات (${totalPaidInSplits.toFixed(2)}) لا يطابق إجمالي الفاتورة (${grandTotal.toFixed(2)}).`);
            return;
        }

        setIsSubmittingCheckout(true);

        const payload = {
            pos_session_id: openSession.id,
            idempotency_key: `pos_${openSession.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            contact_id: selectedCustomer?.id || null,
            discount_type: headerDiscountType === 'none' ? null : headerDiscountType,
            discount_value: headerDiscountType === 'none' ? 0 : headerDiscountValue,
            notes: posNotes,
            lines: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                discount_type: item.discountType === 'none' ? null : item.discountType,
                discount_value: item.discountType === 'none' ? 0 : item.discountValue,
                serials: item.selectedSerials,
            })),
            payments: paymentSplits.map(s => ({
                payment_method_id: s.payment_method_id,
                amount: Number(s.amount),
            })),
        };

        try {
            const response = await fetch('/sales/pos/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setCheckoutError(result.message || 'حدث خطأ أثناء إتمام عملية البيع.');
                setIsSubmittingCheckout(false);
                return;
            }

            // Success! Show Receipt and clear cart
            setCompletedOrder(result.order);
            setIsPaymentModalOpen(false);
            setIsReceiptModalOpen(true);
            resetCart();
            setIsSubmittingCheckout(false);

            // Reload page state silently to refresh stock & session data
            router.reload({ only: ['products', 'openSession'] });
        } catch (err) {
            setCheckoutError('تعذر الاتصال بالخادم. يرجى التحقق من الشبكة وإعادة المحاولة.');
            setIsSubmittingCheckout(false);
        }
    };

    // -------------------------------------------------------------------------
    // Close Session Execution
    // -------------------------------------------------------------------------
    const handleCloseSession = (e) => {
        e.preventDefault();
        setCloseError(null);
        setIsClosingSession(true);

        router.post(`/sales/pos/${openSession.id}/close`, {
            actual_closing: actualClosingBalance,
            notes: closingNotes,
        }, {
            onError: (errs) => {
                setCloseError(errs.actual_closing || errs.error || 'حدث خطأ أثناء إغلاق الجلسة.');
                setIsClosingSession(false);
            },
            onSuccess: () => {
                setIsCloseSessionModalOpen(false);
                setIsClosingSession(false);
            },
        });
    };

    // Print Receipt Helper
    const handlePrintReceipt = () => {
        window.print();
    };

    // =========================================================================
    // RENDER: 1. If NO Session is Open -> Show Opening Screen
    // =========================================================================
    if (!openSession) {
        return (
            <AppLayout>
                <Head title="نقطة البيع — فتح جلسة كاشير" />

                <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '32px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)',
                            }}>
                                <Monitor size={28} color="#fff" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                                    نقطة البيع (POS Terminal)
                                </h1>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                                    افتح جلسة كاشير جديدة لبدء عمليات البيع واستقبال المدفوعات
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/sales/pos-list"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 18px', borderRadius: '10px',
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                color: '#475569', fontSize: '14px', fontWeight: 600,
                                textDecoration: 'none',
                            }}
                        >
                            <Clock size={16} />
                            سجل الجلسات
                        </Link>
                    </div>

                    <div style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '32px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <Power size={22} color="#4f46e5" />
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                                بيانات جلسة الكاشير الجديدة
                            </h2>
                        </div>

                        <form onSubmit={handleOpenSession}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                {/* Branch */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                                        الفرع <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={openData.branch_id}
                                        onChange={e => {
                                            setOpenData(d => ({ ...d, branch_id: e.target.value, warehouse_id: '', treasury_id: '' }));
                                        }}
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px',
                                            border: openErrors.branch_id ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                        }}
                                    >
                                        <option value="">اختر الفرع</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    {openErrors.branch_id && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{openErrors.branch_id}</p>}
                                </div>

                                {/* Warehouse */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                                        المستودع (مخزن الجلسة) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={openData.warehouse_id}
                                        onChange={e => setOpenData('warehouse_id', e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px',
                                            border: openErrors.warehouse_id ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                        }}
                                    >
                                        <option value="">اختر المستودع</option>
                                        {filteredWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                    {openErrors.warehouse_id && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{openErrors.warehouse_id}</p>}
                                </div>

                                {/* Treasury */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                                        الخزينة (صندوق النقدية) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={openData.treasury_id}
                                        onChange={e => setOpenData('treasury_id', e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px',
                                            border: openErrors.treasury_id ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                        }}
                                    >
                                        <option value="">اختر الخزينة</option>
                                        {filteredTreasuries.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    {openErrors.treasury_id && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{openErrors.treasury_id}</p>}
                                </div>

                                {/* Fiscal Year */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                                        السنة المالية <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={openData.fiscal_year_id}
                                        onChange={e => setOpenData('fiscal_year_id', e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px',
                                            border: openErrors.fiscal_year_id ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                        }}
                                    >
                                        <option value="">اختر السنة المالية</option>
                                        {fiscalYears.map(fy => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
                                    </select>
                                    {openErrors.fiscal_year_id && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{openErrors.fiscal_year_id}</p>}
                                </div>

                                {/* Opening Balance */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                                        الرصيد الافتتاحي في الدرج (ر.س) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={openData.opening_balance}
                                            onChange={e => setOpenData('opening_balance', e.target.value)}
                                            style={{
                                                width: '100%', padding: '12px 14px 12px 40px', borderRadius: '10px', fontSize: '16px', fontWeight: 600,
                                                border: openErrors.opening_balance ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                                background: '#f8fafc', boxSizing: 'border-box',
                                            }}
                                            placeholder="0.00"
                                        />
                                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>
                                            ر.س
                                        </span>
                                    </div>
                                    {openErrors.opening_balance && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{openErrors.opening_balance}</p>}
                                </div>

                                {/* Notes */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                                        ملاحظات افتتاح الجلسة
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={openData.notes}
                                        onChange={e => setOpenData('notes', e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px',
                                            border: '1px solid #cbd5e1', background: '#f8fafc', boxSizing: 'border-box',
                                        }}
                                        placeholder="أي ملاحظات تخص الجلسة..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={openProcessing}
                                style={{
                                    width: '100%', padding: '14px 24px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                    color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none',
                                    cursor: openProcessing ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                                }}
                            >
                                <Power size={20} />
                                {openProcessing ? 'جاري فتح الجلسة...' : 'فتح الجلسة وبدء البيع'}
                            </button>
                        </form>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // =========================================================================
    // RENDER: 2. Active POS Terminal Screen (High Speed Cashier Interface)
    // =========================================================================
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100vh',
            background: '#f1f5f9', fontFamily: 'inherit', direction: 'rtl',
            overflow: 'hidden',
        }}>
            <Head title={`نقطة البيع — جلسة ${openSession.session_number}`} />

            {/* ------------------------------------------------------------- */}
            {/* Top Bar                                                       */}
            {/* ------------------------------------------------------------- */}
            <header style={{
                background: '#0f172a', color: '#fff',
                padding: '10px 20px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', zIndex: 10,
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#1e293b', padding: '6px 14px', borderRadius: '8px',
                    }}>
                        <Monitor size={18} color="#38bdf8" />
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>
                            جلسة: {openSession.session_number}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#94a3b8' }}>
                        <span><strong>الفرع:</strong> {openSession.branch?.name}</span>
                        <span>•</span>
                        <span><strong>المستودع:</strong> {openSession.warehouse?.name}</span>
                        <span>•</span>
                        <span><strong>الخزينة:</strong> {openSession.treasury?.name}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={resetCart}
                        title="فاتورة جديدة / مسح السلة (F1)"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#1e293b', border: '1px solid #334155',
                            color: '#e2e8f0', padding: '6px 12px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                        }}
                    >
                        <RotateCcw size={14} />
                        جديدة (F1)
                    </button>

                    <Link
                        href="/sales/pos-list"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#1e293b', border: '1px solid #334155',
                            color: '#e2e8f0', padding: '6px 12px', borderRadius: '8px',
                            textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                        }}
                    >
                        <Clock size={14} />
                        السجل
                    </Link>

                    <button
                        onClick={() => setIsCloseSessionModalOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#ef4444', border: 'none',
                            color: '#fff', padding: '6px 14px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                        }}
                    >
                        <PowerOff size={14} />
                        إغلاق الجلسة
                    </button>
                </div>
            </header>

            {/* ------------------------------------------------------------- */}
            {/* Main Terminal Workspace (2 Columns)                           */}
            {/* ------------------------------------------------------------- */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ========================================================= */}
                {/* Right Side: Search, Categories & Products Grid            */}
                {/* ========================================================= */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    padding: '16px', overflow: 'hidden', borderLeft: '1px solid #e2e8f0',
                }}>
                    {/* Barcode & Search Bar */}
                    <form onSubmit={handleBarcodeSubmit} style={{ marginBottom: '14px' }}>
                        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="امسح الباركود، أو السيريال/IMEI، أو ابحث بالاسم والرمز... (F3)"
                                    style={{
                                        width: '100%', padding: '12px 14px 12px 42px',
                                        borderRadius: '12px', border: '2px solid #cbd5e1',
                                        fontSize: '15px', fontWeight: 500, background: '#fff',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>

                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1',
                                        background: '#fff', color: '#64748b', cursor: 'pointer',
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Category Tabs */}
                    <div style={{
                        display: 'flex', gap: '8px', overflowX: 'auto',
                        paddingBottom: '10px', marginBottom: '12px',
                    }}>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            style={{
                                padding: '8px 16px', borderRadius: '20px', border: 'none',
                                background: selectedCategory === 'all' ? '#0f172a' : '#e2e8f0',
                                color: selectedCategory === 'all' ? '#fff' : '#475569',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            الكل ({products.length})
                        </button>

                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(String(cat.id))}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px', border: 'none',
                                    background: selectedCategory === String(cat.id) ? '#0f172a' : '#e2e8f0',
                                    color: selectedCategory === String(cat.id) ? '#fff' : '#475569',
                                    fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Product Cards Grid */}
                    <div style={{
                        flex: 1, overflowY: 'auto',
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                        gap: '12px', alignContent: 'start', paddingBottom: '16px',
                    }}>
                        {filteredProducts.map(p => {
                            const isSerial = p.tracking_type === 'serial';
                            const stock = Number(p.stock_balance) || 0;
                            const isOutOfStock = stock <= 0;
                            const serialCount = p.available_serials?.length || 0;

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => !isOutOfStock && addToCart(p)}
                                    style={{
                                        background: '#fff',
                                        borderRadius: '14px',
                                        padding: '14px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                        opacity: isOutOfStock ? 0.6 : 1,
                                        display: 'flex', flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                                                background: isSerial ? '#eff6ff' : '#f8fafc',
                                                color: isSerial ? '#2563eb' : '#64748b',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                            }}>
                                                {isSerial && <Smartphone size={12} />}
                                                {isSerial ? 'جهاز بسيريال' : (p.unit?.name || 'قطعة')}
                                            </span>

                                            <span style={{
                                                fontSize: '12px', fontWeight: 700,
                                                color: isOutOfStock ? '#ef4444' : '#16a34a',
                                            }}>
                                                {isSerial ? `${serialCount} متاح` : `رصيد: ${stock}`}
                                            </span>
                                        </div>

                                        <h3 style={{
                                            margin: '0 0 4px', fontSize: '14px', fontWeight: 700,
                                            color: '#1e293b', lineHeight: 1.4,
                                        }}>
                                            {p.name}
                                        </h3>

                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            {p.sku && <span>SKU: {p.sku} </span>}
                                            {p.barcode && <span>• {p.barcode}</span>}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #f1f5f9',
                                    }}>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                            {Number(p.selling_price).toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>ر.س</span>
                                        </span>

                                        <button
                                            type="button"
                                            disabled={isOutOfStock}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                border: 'none', background: isOutOfStock ? '#cbd5e1' : '#4f46e5',
                                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredProducts.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1', textAlign: 'center', padding: '48px 16px',
                                color: '#94a3b8',
                            }}>
                                <AlertCircle size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                                <p style={{ fontSize: '15px', fontWeight: 600 }}>لا توجد منتجات مطابقة للبحث أو التصنيف</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ========================================================= */}
                {/* Left Side: Live POS Cart & Settlement Panel               */}
                {/* ========================================================= */}
                <div style={{
                    width: '460px', background: '#fff', display: 'flex', flexDirection: 'column',
                    boxShadow: '-4px 0 20px rgba(0,0,0,0.03)',
                }}>
                    {/* Customer Bar */}
                    <div style={{
                        padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <UserIcon size={18} color="#64748b" />
                        <div style={{ flex: 1 }}>
                            <select
                                value={selectedCustomer?.id || ''}
                                onChange={e => {
                                    const c = customers.find(item => String(item.id) === e.target.value);
                                    setSelectedCustomer(c || null);
                                }}
                                style={{
                                    width: '100%', padding: '6px 10px', borderRadius: '8px',
                                    border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600,
                                    background: '#fff',
                                }}
                            >
                                <option value="">عميل نقدي عام (Walk-in)</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.phone ? `(${c.phone})` : ''} {c.credit_limit ? `(سقف: ${Number(c.credit_limit).toFixed(2)})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                        {cart.length === 0 ? (
                            <div style={{
                                height: '100%', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
                            }}>
                                <ShoppingCart size={48} strokeWidth={1.5} style={{ marginBottom: '12px' }} />
                                <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>السلة فارغة</p>
                                <p style={{ fontSize: '13px', margin: '4px 0 0' }}>امسح بالباركود أو اختر من قائمة المنتجات</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {cart.map((item, idx) => {
                                    const isSerial = item.product.tracking_type === 'serial';
                                    const rawTotal = item.unitPrice * item.quantity;
                                    let lineDisc = 0;
                                    if (item.discountType === 'percentage') {
                                        lineDisc = (rawTotal * item.discountValue) / 100;
                                    } else if (item.discountType === 'fixed') {
                                        lineDisc = item.discountValue;
                                    }
                                    const lineNet = Math.max(0, rawTotal - lineDisc);

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                border: '1px solid #e2e8f0', borderRadius: '12px',
                                                padding: '10px 12px', background: '#f8fafc',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                                                        {item.product.name}
                                                    </h4>
                                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                        {item.unitPrice.toFixed(2)} ر.س / {item.product.unit?.name || 'وحدة'}
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(idx)}
                                                    style={{
                                                        border: 'none', background: 'transparent',
                                                        color: '#ef4444', cursor: 'pointer', padding: '4px',
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Quantity and Price Row */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                {/* Qty controls */}
                                                <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(idx, -1)}
                                                        style={{ border: 'none', background: 'transparent', padding: '6px 10px', cursor: 'pointer' }}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '28px', textAlign: 'center' }}>
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(idx, 1)}
                                                        style={{ border: 'none', background: 'transparent', padding: '6px 10px', cursor: 'pointer' }}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                {/* Serial button if serial item */}
                                                {isSerial && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openSerialModal(idx)}
                                                        style={{
                                                            fontSize: '12px', fontWeight: 600, padding: '6px 10px',
                                                            borderRadius: '8px', border: '1px solid',
                                                            borderColor: item.selectedSerials.length === item.quantity ? '#10b981' : '#f59e0b',
                                                            background: item.selectedSerials.length === item.quantity ? '#ecfdf5' : '#fffbeb',
                                                            color: item.selectedSerials.length === item.quantity ? '#047857' : '#b45309',
                                                            display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Smartphone size={14} />
                                                        {item.selectedSerials.length === item.quantity
                                                            ? `تم اختيار ${item.selectedSerials.length} أجهزة`
                                                            : `اختر ${item.selectedSerials.length}/${item.quantity} سيريال`}
                                                    </button>
                                                )}

                                                <div style={{ textAlign: 'left', fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                                                    {lineNet.toFixed(2)} <span style={{ fontSize: '11px', color: '#64748b' }}>ر.س</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Cart Summary & Checkout Footer */}
                    <div style={{
                        padding: '16px', borderTop: '2px solid #e2e8f0', background: '#fff',
                    }}>
                        {/* Summary breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>المجموع الفرعي:</span>
                                <span>{subtotal.toFixed(2)} ر.س</span>
                            </div>

                            {/* Header Discount Input if allowed */}
                            {userCanDiscount && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ color: '#64748b' }}>خصم الفاتورة:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <select
                                            value={headerDiscountType}
                                            onChange={e => setHeaderDiscountType(e.target.value)}
                                            style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="none">بدون</option>
                                            <option value="fixed">مبلغ (ر.س)</option>
                                            <option value="percentage">نسبة (%)</option>
                                        </select>
                                        {headerDiscountType !== 'none' && (
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={headerDiscountValue}
                                                onChange={e => setHeaderDiscountValue(e.target.value)}
                                                style={{ width: '60px', fontSize: '12px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                                            />
                                        )}
                                        <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                            -{headerDiscountAmount.toFixed(2)} ر.س
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>ضريبة القيمة المضافة (15%):</span>
                                <span>{taxTotal.toFixed(2)} ر.س</span>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginTop: '6px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1',
                                fontSize: '18px', fontWeight: 800, color: '#0f172a',
                            }}>
                                <span>الإجمالي النهائي:</span>
                                <span style={{ color: '#4f46e5', fontSize: '22px' }}>
                                    {grandTotal.toFixed(2)} <span style={{ fontSize: '14px', color: '#64748b' }}>ر.س</span>
                                </span>
                            </div>
                        </div>

                        {/* Pay Button */}
                        <button
                            type="button"
                            disabled={cart.length === 0}
                            onClick={openPaymentModal}
                            style={{
                                width: '100%', padding: '14px 20px', borderRadius: '12px',
                                background: cart.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff', fontSize: '17px', fontWeight: 800, border: 'none',
                                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: cart.length === 0 ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.35)',
                            }}
                        >
                            <CreditCard size={20} />
                            دفع وإصدار الفاتورة (F2)
                        </button>
                    </div>
                </div>
            </div>

            {/* ============================================================= */}
            {/* MODAL 1: Serial Selection Modal                               */}
            {/* ============================================================= */}
            {isSerialModalOpen && activeCartIndexForSerial !== null && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '18px', width: '90%', maxWidth: '580px',
                        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>
                                    تحديد السيريال / IMEI للأجهزة
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                                    المنتج: {cart[activeCartIndexForSerial]?.product?.name} (المطلوب: {cart[activeCartIndexForSerial]?.quantity})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSerialModalOpen(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search in Serials */}
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                            <input
                                type="text"
                                value={serialSearchQuery}
                                onChange={e => setSerialSearchQuery(e.target.value)}
                                placeholder="ابحث برقم السيريال أو IMEI..."
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                                    border: '1px solid #cbd5e1', fontSize: '14px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Serials List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                {(cart[activeCartIndexForSerial]?.product?.available_serials || [])
                                    .filter(s => {
                                        const q = serialSearchQuery.trim().toLowerCase();
                                        return !q ||
                                            s.serial_number?.toLowerCase().includes(q) ||
                                            s.imei1?.includes(q) ||
                                            s.imei2?.includes(q);
                                    })
                                    .map(s => {
                                        const isSelected = cart[activeCartIndexForSerial]?.selectedSerials.includes(s.id);
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => toggleSerialSelection(s.id)}
                                                style={{
                                                    padding: '12px 16px', borderRadius: '10px',
                                                    border: '2px solid',
                                                    borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                                                    background: isSelected ? '#eef2ff' : '#fff',
                                                    cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'space-between',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                                                        SN: {s.serial_number}
                                                    </div>
                                                    {(s.imei1 || s.imei2) && (
                                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                            {s.imei1 && <span>IMEI1: {s.imei1} </span>}
                                                            {s.imei2 && <span>• IMEI2: {s.imei2}</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{
                                                    width: '22px', height: '22px', borderRadius: '6px',
                                                    border: isSelected ? 'none' : '2px solid #cbd5e1',
                                                    background: isSelected ? '#4f46e5' : '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {isSelected && <CheckCircle2 size={16} color="#fff" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        <div style={{
                            padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                تم اختيار {cart[activeCartIndexForSerial]?.selectedSerials.length} من أصل {cart[activeCartIndexForSerial]?.quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsSerialModalOpen(false)}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px', background: '#0f172a',
                                    color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px',
                                    cursor: 'pointer',
                                }}
                            >
                                اعتماد واغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 2: Payment Settlement Modal (Multi-Payment)              */}
            {/* ============================================================= */}
            {isPaymentModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '20px', width: '90%', maxWidth: '640px',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#f8fafc',
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                    تسوية ودفع الفاتورة
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                                    المطلوب سداده: <strong style={{ color: '#4f46e5' }}>{grandTotal.toFixed(2)} ر.س</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPaymentModalOpen(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                            {checkoutError && (
                                <div style={{
                                    padding: '12px 16px', borderRadius: '10px', background: '#fef2f2',
                                    border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px',
                                    fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <AlertCircle size={18} />
                                    {checkoutError}
                                </div>
                            )}

                            {/* Split Rows */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                    طرق الدفع والتجزئة:
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {paymentSplits.map((split, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <select
                                                value={split.payment_method_id}
                                                onChange={e => updatePaymentSplit(i, 'payment_method_id', e.target.value)}
                                                style={{
                                                    flex: 1, padding: '10px 12px', borderRadius: '10px',
                                                    border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600,
                                                }}
                                            >
                                                {paymentMethods.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name} ({m.type === 'cash' ? 'نقدي' : m.type === 'network' ? 'شبكة/مدى' : m.type === 'credit' ? 'آجل' : m.type})
                                                    </option>
                                                ))}
                                            </select>

                                            <div style={{ position: 'relative', width: '150px' }}>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={split.amount}
                                                    onChange={e => updatePaymentSplit(i, 'amount', e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '10px 12px 10px 32px', borderRadius: '10px',
                                                        border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 700,
                                                        textAlign: 'center', boxSizing: 'border-box',
                                                    }}
                                                />
                                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94a3b8' }}>
                                                    ر.س
                                                </span>
                                            </div>

                                            {paymentSplits.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePaymentSplit(i)}
                                                    style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={addPaymentSplit}
                                    style={{
                                        marginTop: '10px', padding: '6px 12px', borderRadius: '8px',
                                        border: '1px dashed #cbd5e1', background: '#f8fafc',
                                        fontSize: '13px', fontWeight: 600, color: '#4f46e5',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                    }}
                                >
                                    <Plus size={14} />
                                    إضافة طريقة دفع أخرى (تقسيم)
                                </button>
                            </div>

                            {/* Quick Tender Buttons for Cash */}
                            {cashSplit && (
                                <div style={{
                                    background: '#f8fafc', borderRadius: '14px', padding: '14px',
                                    border: '1px solid #e2e8f0', marginBottom: '16px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                            المبلغ المستلم نقداً من العميل:
                                        </span>
                                        <input
                                            type="number"
                                            value={tenderedCash}
                                            onChange={e => setTenderedCash(e.target.value)}
                                            style={{
                                                width: '120px', padding: '6px 10px', borderRadius: '8px',
                                                border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700,
                                                textAlign: 'center',
                                            }}
                                        />
                                    </div>

                                    {/* Quick cash denomination buttons */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'المطابق', val: grandTotal },
                                            { label: '50 ر.س', val: 50 },
                                            { label: '100 ر.س', val: 100 },
                                            { label: '200 ر.س', val: 200 },
                                            { label: '500 ر.س', val: 500 },
                                        ].map((btn, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleQuickCash(btn.val)}
                                                style={{
                                                    padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                                    background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                }}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', marginTop: '10px',
                                        paddingTop: '8px', borderTop: '1px dashed #cbd5e1',
                                        fontSize: '14px', fontWeight: 700, color: '#047857',
                                    }}>
                                        <span>المتبقي للعميل (الباقي):</span>
                                        <span style={{ fontSize: '16px' }}>{changeDue.toFixed(2)} ر.س</span>
                                    </div>
                                </div>
                            )}

                            {/* Difference indicator */}
                            <div style={{
                                padding: '12px 16px', borderRadius: '10px',
                                background: Math.abs(splitDifference) < 0.01 ? '#ecfdf5' : '#fffbeb',
                                border: '1px solid',
                                borderColor: Math.abs(splitDifference) < 0.01 ? '#86efac' : '#fde68a',
                                display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700,
                            }}>
                                <span>حالة التغطية:</span>
                                <span>
                                    {Math.abs(splitDifference) < 0.01
                                        ? 'مغطاة بالكامل ✓'
                                        : splitDifference > 0
                                            ? `متبقي: ${splitDifference.toFixed(2)} ر.س`
                                            : `فائض: ${Math.abs(splitDifference).toFixed(2)} ر.س`}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
                            display: 'flex', gap: '12px',
                        }}>
                            <button
                                type="button"
                                onClick={() => setIsPaymentModalOpen(false)}
                                style={{
                                    padding: '12px 20px', borderRadius: '10px', border: '1px solid #cbd5e1',
                                    background: '#fff', color: '#475569', fontWeight: 600, fontSize: '14px',
                                    cursor: 'pointer',
                                }}
                            >
                                إلغاء
                            </button>

                            <button
                                type="button"
                                disabled={isSubmittingCheckout || Math.abs(splitDifference) > 0.05}
                                onClick={handleCheckout}
                                style={{
                                    flex: 1, padding: '12px 24px', borderRadius: '10px', border: 'none',
                                    background: isSubmittingCheckout || Math.abs(splitDifference) > 0.05
                                        ? '#cbd5e1'
                                        : 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff', fontWeight: 700, fontSize: '16px',
                                    cursor: isSubmittingCheckout || Math.abs(splitDifference) > 0.05 ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                }}
                            >
                                <CheckCircle2 size={18} />
                                {isSubmittingCheckout ? 'جاري الحفظ والطباعة...' : 'تأكيد العملية وطباعة الإيصال'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 3: Receipt Print Preview Modal (80mm Thermal Receipt)    */}
            {/* ============================================================= */}
            {isReceiptModalOpen && completedOrder && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 60, backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '16px', width: '360px',
                        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                    }}>
                        {/* Actions top */}
                        <div style={{
                            padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#f8fafc',
                        }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>
                                تم تسجيل الفاتورة بنجاح ✓
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsReceiptModalOpen(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Printable Thermal Receipt (80mm style) */}
                        <div id="pos-thermal-receipt" style={{
                            flex: 1, overflowY: 'auto', padding: '16px',
                            fontFamily: 'monospace, sans-serif', fontSize: '12px',
                            color: '#000', background: '#fff',
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                                <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 900 }}>
                                    مؤسسة ركن الأجهزة والاتصالات
                                </h2>
                                <p style={{ margin: '2px 0', fontSize: '11px' }}>فاتورة ضريبية مبسطة</p>
                                <p style={{ margin: '2px 0', fontSize: '10px' }}>الرقم الضريبي: 300000000000003</p>
                                <p style={{ margin: '2px 0', fontSize: '10px' }}>الفرع: {openSession.branch?.name}</p>
                            </div>

                            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0', fontSize: '11px' }}>
                                <div>رقم الفاتورة: <strong>{completedOrder.order_number}</strong></div>
                                <div>التاريخ: {new Date(completedOrder.date).toLocaleDateString('ar-SA')} {new Date().toLocaleTimeString('ar-SA')}</div>
                                <div>العميل: {completedOrder.contact?.name || 'عميل نقدي عام'}</div>
                                <div>الكاشير: جلسة #{openSession.session_number}</div>
                            </div>

                            {/* Lines */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', margin: '8px 0' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #000', textAlign: 'right' }}>
                                        <th style={{ padding: '4px 0' }}>الصنف</th>
                                        <th style={{ padding: '4px 0', textAlign: 'center' }}>الكمية</th>
                                        <th style={{ padding: '4px 0', textAlign: 'left' }}>الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(completedOrder.lines || []).map((line, i) => (
                                        <React.Fragment key={i}>
                                            <tr>
                                                <td style={{ padding: '4px 0', fontWeight: 700 }}>
                                                    {line.product?.name}
                                                </td>
                                                <td style={{ padding: '4px 0', textAlign: 'center' }}>
                                                    {line.quantity}
                                                </td>
                                                <td style={{ padding: '4px 0', textAlign: 'left', fontWeight: 700 }}>
                                                    {Number(line.total_amount).toFixed(2)}
                                                </td>
                                            </tr>
                                            {/* Serials listed if any */}
                                            {line.serials && line.serials.length > 0 && (
                                                <tr>
                                                    <td colSpan="3" style={{ fontSize: '9px', color: '#444', paddingBottom: '4px' }}>
                                                        S/N: {line.serials.map(s => s.product_serial?.serial_number || s.serial_id).join(', ')}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div style={{ borderTop: '1px dashed #000', paddingTop: '6px', fontSize: '11px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                                    <span>المجموع قبل الضريبة:</span>
                                    <span>{Number(completedOrder.subtotal).toFixed(2)} ر.س</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                                    <span>ضريبة القيمة المضافة:</span>
                                    <span>{Number(completedOrder.tax_amount).toFixed(2)} ر.س</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '14px', fontWeight: 900 }}>
                                    <span>الإجمالي الكلي:</span>
                                    <span>{Number(completedOrder.total_amount).toFixed(2)} ر.س</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                                    <span>المدفوع:</span>
                                    <span>{Number(completedOrder.paid_amount).toFixed(2)} ر.س</span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#555' }}>
                                <p style={{ margin: '2px 0' }}>شكراً لزيارتكم ونسعد بخدمتكم دائماً</p>
                                <p style={{ margin: '2px 0' }}>البضاعة المباعة ترد وتستبدل حسب الشروط</p>
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div style={{
                            padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
                            display: 'flex', gap: '8px',
                        }}>
                            <button
                                type="button"
                                onClick={handlePrintReceipt}
                                style={{
                                    flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none',
                                    background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: '14px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                }}
                            >
                                <Printer size={16} />
                                طباعة
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsReceiptModalOpen(false)}
                                style={{
                                    padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                    background: '#fff', color: '#475569', fontWeight: 600, fontSize: '14px',
                                    cursor: 'pointer',
                                }}
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* MODAL 4: Close POS Session Modal                              */}
            {/* ============================================================= */}
            {isCloseSessionModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '18px', width: '90%', maxWidth: '480px',
                        padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PowerOff size={22} color="#ef4444" />
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                                    إغلاق جلسة الكاشير {openSession.session_number}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCloseSessionModalOpen(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {closeError && (
                            <div style={{
                                padding: '10px 14px', borderRadius: '8px', background: '#fef2f2',
                                border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px',
                                fontWeight: 600, marginBottom: '14px',
                            }}>
                                {closeError}
                            </div>
                        )}

                        <form onSubmit={handleCloseSession}>
                            <div style={{
                                background: '#f8fafc', borderRadius: '12px', padding: '14px',
                                border: '1px solid #e2e8f0', marginBottom: '16px',
                                display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>الرصيد الافتتاحي:</span>
                                    <span style={{ fontWeight: 600 }}>{Number(openSession.opening_balance).toFixed(2)} ر.س</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>الرصيد الدفتري المتوقع:</span>
                                    <span style={{ fontWeight: 700, color: '#4f46e5' }}>
                                        {Number(openSession.expected_closing || openSession.opening_balance).toFixed(2)} ر.س
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    الرصيد الفعلي في الدرج (العد الحقيقي) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={actualClosingBalance}
                                    onChange={e => setActualClosingBalance(e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                                        border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 700,
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                    ملاحظات الإغلاق
                                </label>
                                <textarea
                                    rows="2"
                                    value={closingNotes}
                                    onChange={e => setClosingNotes(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                                        border: '1px solid #cbd5e1', fontSize: '13px',
                                        boxSizing: 'border-box',
                                    }}
                                    placeholder="أي ملاحظات حول الجلسة أو الفروقات..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsCloseSessionModalOpen(false)}
                                    style={{
                                        padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                        background: '#fff', color: '#475569', fontWeight: 600, fontSize: '14px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={isClosingSession || !actualClosingBalance}
                                    style={{
                                        flex: 1, padding: '10px 18px', borderRadius: '8px', border: 'none',
                                        background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '14px',
                                        cursor: isClosingSession || !actualClosingBalance ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {isClosingSession ? 'جاري الإغلاق...' : 'تأكيد إغلاق الجلسة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

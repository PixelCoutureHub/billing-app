import { useNavigation } from '@react-navigation/native';
import React, { Fragment, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { OnboardingButton } from '../../components/commonButton';
import { CustomNavigateBox, CustomTextInputField, MultiLineTextBox, MultiSelectOption, RadioBtn, TopHeader } from '../../components/commonComponents';
import CustomModal from '../../components/commonModal';
import DashedLine from '../../components/dashedLine';
import { addedProductData } from '../../utils/data/invoiceData';
import CustomIcon from '../../utils/icons';
import { labels } from '../../utils/labels';
import { screenName } from '../../utils/screenNames';
import { colors } from '../../utils/theme/colors';
import { alignItemCenter, alignSelfCenter, flex1, flexRow, justifyBetween, justifyCenter, justifyStart, m10, mb5, mh10, mh15, ml10, ml15, mr5, mt10, mt15, mt5, mv10, mv15, mv5, p10 } from '../../utils/theme/commonStyles';
import { AddBankDetails, AddSignature, AddTax } from '../settings/settingsComponent';
import { getMethod } from '../../services/apiService';
import { ApiUrl } from '../../services/apiUrl';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { CustomTextInput } from '../../components/commonInputFields';
import { requiredValidation } from '../../utils/validationConfig';
import { CommonDropDownPicker } from '../../components/CommonDropDownPicker';
import { CommonDatePicker } from '../../components/CommonDatePicker';
import { CalculationTotal, CalculateDiscount, CalculateTaxTotal } from '../../utils/Calculation';
import { convertToFormData } from '../../utils/FormDataFunc';
import { AddPurchaseOrderData, UpdatePurchaseOrderData } from '../../userCall/ApiUser';
import * as TYPES from '../../action/ActionType';
import { useToast } from 'react-native-toast-notifications';
import { currencySymbol } from '../../constant/constApi';
import { commonStyles, getTopNotchStyle, getMainContainerStyle, KeyboardAScrollView } from '../../utils/commonStyles';

export type AddPurchaseOrderScreenProps = {

}
type vendorId = {

}

type formkeys = {
    vendorId: string;
    purchaseOrderDate: string;
    referenceNo: string;
    bank: string;
    notes: string;
    termsAndCondition: string;
    signatureId: string;
    sign_type: string;
    taxableAmount: string;
    TotalAmount: string;
    vat: string;
    totalDiscount: string;
    roundOff: string;
    isRecurring: string;
    recurringCycle: string;
    purchaseOrderId: string;
    dueDate: string;
    signatureName: string,
    signatureImage: string,
};

const AddPurchaseOrderScreen = ({ route }: any) => {
    const vendorDetails = route?.params?.vendorDetails;
    console.log("vendor details", vendorDetails)
    const dispatch = useDispatch();
    const [termsCondition, setTermsCondition] = useState('');
    const [selectedSignature, setSelectedSignature] = useState<string | null>('');
    const [checkBox, setCheckBox] = useState(false);
    const [isActiveBtn, setIsActiveBtn] = useState(false);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState<boolean | null>(false);
    const [purchaseOrderId, setPurchaseOrderId] = useState<string>('');
    const [dropDownBank, setDropDownBank] = useState<string | null>(null);
    const [paymenttype, setPaymenttype] = useState<string | null>(null);
    const [addedProduct, setAddedProduct] = useState<any[]>([]);
    const [total, setTotal] = useState<any>(0);
    const [taxTotal, setTaxTotal] = useState<any>(0);
    const [discountTotal, setDiscountTotal] = useState<any>(0);
    const [dropdownValue, setDropdownValue] = useState<string | null>(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
    const [dropDownSignature, setDropDownSignature] = useState<string | null>(null);
    const [isFocusSignature, setIsFocusSignature] = useState<boolean>(false);
    const [selectedDateType, setSelectedDateType] = useState<'purchaseOrderDate' | 'dueDate' | null>(null);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [isFocusBank, setIsFocusBank] = useState<boolean>(false);
    const [isFocus, setIsFocus] = useState<boolean>(false);
    const [addBankDetailsModal, setAddBankDetailsModal] = useState(false);
    const [addTaxModal, setAddTaxModal] = useState(false);
    const [SignImage, setSignImage] = useState<any>(null);
    const [OpenSignature, SetOpenSignature] = useState<boolean>(false);
    const customerList = useSelector((state: any) => state.Reducer.customer);
    const productList = useSelector((state: any) => state.Reducer.product);
    const taxList = useSelector((state: any) => state.Reducer.tax);
    const bankList = useSelector((state: any) => state.Reducer.bank);
    const signatureList = useSelector((state: any) => state.Reducer.signature);
    const vendorList = useSelector((state: any) => state.Reducer.vendor);
    const [editItem, setEditItem] = useState<any>(null);
    const toast = useToast();

    const navigation = useNavigation()

    const { control,
        getValues,
        setValue,
        reset,
        handleSubmit,
        trigger,
        formState: { errors }, } = useForm<formkeys>({
            defaultValues: {
                purchaseOrderDate: '',
                referenceNo: '',
                bank: '',
                notes: '',
                termsAndCondition: '',
                signatureId: '',
                sign_type: '',
                taxableAmount: '',
                TotalAmount: '',
                vat: '',
                totalDiscount: '',
                roundOff: '',
                isRecurring: '',
                recurringCycle: '',
                dueDate: '',
                signatureName: '',
                signatureImage: '',
            }
        });

    useEffect(() => {
        getAddpurchaseOrderData();

        if (vendorDetails) {
            getEditPurchaseOrderData();
        }
    }, [])

    useEffect(() => {
        doCalculation();
    }, [addedProduct])

    useEffect(() => {
        const vendorDetails = route?.params?.vendorDetails;
        console.log(vendorDetails, "VENDOR DETAILSSSS");

    })

    const getDiscountAmount = (item: any) => {
        const sellingPrice = parseFloat(item?.sellingPrice) * parseFloat(item?.quantity ?? 0);
        const discountValue = item.discountType == "3" ? parseFloat(item.discountValue) :
            (sellingPrice * parseFloat(item?.discountValue ?? 0)) / 100;
        return discountValue;
    }

    const doCalculation = () => {
        let total = 0;
        let discountTotal = 0;
        let taxTotal = 0;

        addedProduct.map((item: any) => {
            const sellingPrice = parseFloat(item?.sellingPrice) * parseFloat(item?.quantity ?? 0);
            const discountValue = item.discountType == "3" ? parseFloat(item.discountValue) :
                (sellingPrice * parseFloat(item?.discountValue ?? 0)) / 100;
            const taxRate = parseFloat(item?.tax?.taxRate);
            const amount = sellingPrice - discountValue;
            const taxItem = (amount * taxRate) / 100;
            total += sellingPrice;
            discountTotal += discountValue;
            taxTotal += taxItem;
        })
        setTotal(total);
        setDiscountTotal(discountTotal);
        setTaxTotal(taxTotal);
    }

    const getItemTotal = (item: any) => {
        const sellingPrice = parseFloat(item?.sellingPrice) * parseFloat(item?.quantity ?? 0);
        const discountValue = item.discountType == "3" ? parseFloat(item.discountValue) :
            (sellingPrice * parseFloat(item?.discountValue ?? 0)) / 100;
        const taxRate = parseFloat(item?.tax?.taxRate);
        const amount = sellingPrice - discountValue;
        const taxItem = (amount * taxRate) / 100;
        return amount + taxItem;
    }
    const getEditPurchaseOrderData = () => {
        setPurchaseOrderId(vendorDetails?.purchaseOrderId)
        console.log("purchaseOrderId in edit", vendorDetails?.purchaseOrderId)
        handleDropdownChange(vendorDetails.vendorInfo)
        setValue('referenceNo', vendorDetails?.referenceNo)
        setValue('purchaseOrderDate', moment(vendorDetails?.purchaseOrderDate).format('YYYY-MM-DD'))
        setValue('dueDate', moment(vendorDetails?.dueDate).format('YYYY-MM-DD'))
        setPaymenttype(vendorDetails?.payment_method)
        setDropDownBank(bankList.find((bank: any) => bank._id === vendorDetails?.bank)?.bankName ?? '');
        setValue('bank', vendorDetails?.bank);
        const parsedItems = vendorDetails.items.map((item: { taxInfo: string }) => {
            item.sellingPrice = parseFloat(item.rate);
            item.discountValue = parseFloat(item.discount);
            item._id = item.productId;
            item.taxInfo = productList.find((product: any) => product._id === item.productId)?.tax;
            item.tax = productList.find((product: any) => product._id === item.productId)?.tax;
            item.discountType = productList.find((product: any) => product._id === item.productId)?.discountType;
            return item;
        });

        setValue('purchaseOrderId', vendorDetails?.purchaseOrderId)
        setValue('notes', vendorDetails?.notes)
        setNotes(vendorDetails?.notes);
        setValue('sign_type', vendorDetails?.sign_type == 'manualSignature' ? "manualSignature" : "eSignature")
        handleDropdownSignature(vendorDetails?.signatureId)
        setSelectedSignature(vendorDetails?.sign_type == 'manualSignature' ? "Manual Signature" : "E-Signature")
        if (vendorDetails?.sign_type !== 'manualSignature') {
            setSignImage(vendorDetails?.signatureImage)
            setValue('signatureName', vendorDetails?.signatureName)
            setValue('signatureImage', vendorDetails?.signatureImage)
        }

        setValue('termsAndCondition', vendorDetails?.terms_conditions ?? vendorDetails.termsAndCondition)
        console.log(vendorDetails?.terms_conditions ?? vendorDetails.termsAndCondition, 'Terms and condition');

        setValue('taxableAmount', vendorDetails?.tax)
        setValue('TotalAmount', vendorDetails?.TotalAmount)
        setValue('vat', vendorDetails?.vat)
        setValue('totalDiscount', vendorDetails?.totalDiscount)
        setValue('roundOff', vendorDetails?.roundOff)
        setValue('isRecurring', vendorDetails?.isRecurring)
        setValue('recurringCycle', vendorDetails?.recurringCycle)
        setValue('vendorId', vendorDetails?.vendorId)

        setTaxTotal(Number(vendorDetails?.vat))
        setDiscountTotal(Number(vendorDetails?.totalDiscount))
        setTotal(Number(vendorDetails?.taxableAmount))
        setSelectedSignature(vendorDetails?.sign_type == 'manualSignature' ? "Manual Signature" : "E-Signature")
        setAddedProduct(parsedItems);
        // setDropdownStatus(status); // Set dropdown for status
    }


    const getAddpurchaseOrderData = () => {
        if (!vendorDetails) {
            getMethod(
                ApiUrl.getPurchaseOrderId,
                success => {
                    if (success.code === 200) {
                        console.log('Successfully getAddpurchaseOrderData', success.data);
                        setValue('purchaseOrderId', success.data);
                        //removewhitespace and set value
                        setPurchaseOrderId(success.data.replace(/\s/g, ''));
                    } else {
                        console.log('Failed to getAddpurchaseOrderData:', success.message);
                    }
                },
                error => {
                    console.log('Error fetching getAddpurchaseOrderData:', error);
                }
            );
        }
    }

    const handleDropdownChange = (item: { vendor_name: string, id: number, _id: string }) => {
        console.log('item vendor name', item);
        setDropdownValue(item.vendor_name);
        setValue('vendorId', item._id);
        setIsDropdownVisible(false);
    };

    const handleDropdownSignature = (item: {
        signatureName: string; name: string, _id: string, signatureImage: string
    }) => {
        console.log('item in dropdown signatire', item);
        setSignImage(item?.signatureImage);
        setDropDownSignature(item?.name ?? item?.signatureName);
        setValue('signatureId', item?._id);
        setIsFocusSignature(false);
    };

    const showDatePickerModal = (type: 'purchaseOrderDate' | 'dueDate') => {
        setSelectedDateType(type);
        if (type === 'purchaseOrderDate') {
            setDate(true);
        }
        else {
            setDate(false);
        }
        setShowDatePicker(true);
    };

    const handleDateCancel = () => {
        setShowDatePicker(false);
    };

    const handleDateConfirm = (date: any) => {
        const formattedDate = date.dateString || new Date(date.date).toISOString().split('T')[0];
        if (selectedDateType === 'purchaseOrderDate') {
            setValue('purchaseOrderDate', formattedDate);
        }
        else if (selectedDateType === 'dueDate') {
            setValue('dueDate', formattedDate);
        }
        setShowDatePicker(false);
    };

    const handleSignatureSelect = (status: string) => {
        setValue('sign_type', status == "Manual Signature" ? "manualSignature" : "eSignature");
        setSelectedSignature(status);
        if (status !== "Manual Signature") {
            SetOpenSignature(true);
        }
    };

    const handleSaveBtnClick = async () => {
        const isValid = await trigger();
        console.log(isValid);
        if (!isValid) {
            console.log('its not valid')
            toast.show("Please fill all mandatory fields", { type: "normal", placement: "bottom", duration: 4000, animationType: "slide-in", });
            return
        }
        else if (!dropdownValue || !dropDownBank || !selectedSignature) {
            console.log('its dropdown', dropdownValue, dropDownBank, selectedSignature)
            toast.show("Please fill all mandatory fields", { type: "normal", placement: "bottom", duration: 4000, animationType: "slide-in", });
            return
        }
        setIsActiveBtn(true);
        setValue('TotalAmount', checkBox ? Math.round(total - discountTotal + taxTotal) : total - discountTotal + taxTotal);
        setValue('isRecurring', 'false');
        setValue('roundOff', checkBox ? 'true' : 'false');
        // setValue('notes', notes);
        // setValue('terms_conditions', termsCondition);
        setValue('vat', taxTotal);
        setValue('taxableAmount', total);
        setValue('totalDiscount', discountTotal);
        setValue('totalDiscount', discountTotal);

        setDropDownBank(vendorDetails?.bankList); // Set dropdown for payment mode

        const formData = convertToFormData(getValues(), addedProduct);
        console.log("formdata values form add vendor", formData)
        console.log(formData instanceof FormData, "formData from add vendor");

        if (formData && !vendorDetails && formData instanceof FormData) {
            AddPurchaseOrderData(formData, navigation);
            console.log("this is add vendor")
            return
        }
        else {
            console.log("this is edit vendor", vendorDetails, formData instanceof FormData)
            UpdatePurchaseOrderData(formData, vendorDetails?._id, navigation);
            return
        }
    };

    const handleCancelBtnClick = () => {
        navigation.goBack();
    };

    const handleCheckBox = () => {
        setCheckBox(!checkBox);
    }

    const openModal = () => {
        setAddBankDetailsModal(true);
    };

    const openTaxModal = (item: object) => {
        setAddTaxModal(true);
        setEditItem(item);
    };

    const handleDropdownBank = (item: { bankName: string, _id: string }) => {
        console.log('item bank issue', item);
        setDropDownBank(item.bankName);
        setValue('bank', item._id);
        setIsFocusBank(false);
    };

    const EditProduct = (item: any) => {
        const index = addedProduct.findIndex(
            (product: any) => product._id === item._id,
        )
        addedProduct[index] = item;
        console.log('addedProduct', item);
        setAddedProduct([...addedProduct]);
        // doCalculation();
        closeModal();
    };

    const handlereturnData = (data: any) => {
        data.forEach((item: any) => {
            item.sellingPrice = item.purchasePrice
        })
        setAddedProduct([...addedProduct, ...data]);
        // doCalculation();
    };
    const deleteItem = (item: any) => {
        if (vendorDetails) {
            const data = addedProduct.filter((i: any) => i._id !== item._id);
            setAddedProduct(data);
        }
        else {
            const data = addedProduct.filter((i: any) => i._id !== item._id);
            setAddedProduct(data);
        };
    }

    const calculateAmount = (item: any) => {
        const sellingPrice =
            (Number(item?.sellingPrice) || Number(item?.rate)) * Number(item?.quantity);
        // const discountValue = Number(item?.discountValue) || Number(item?.discount);
        const discountValue = Number(item?.discountValue) || Number(item?.discount) || 0
        const taxRate =
            item?.tax?.taxRate !== undefined
                ? Number(item?.tax?.taxRate)
                : item?.taxInfo?.taxRate !== undefined
                    ? Number(item?.taxInfo?.taxRate)
                    : 0; // Fallback to 0 if taxRate is undefined
        const amount = sellingPrice - discountValue;
        const taxItem = (amount * taxRate) / 100;

        console.log(
            `Calculated amount: Selling Price = ${sellingPrice}, Discount = ${discountValue}, Tax Rate = ${taxRate}, Amount = ${amount}, Tax Item = ${taxItem}`
        );

        return amount + taxItem;
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[{ backgroundColor: colors.greyOne, borderRadius: 8, width: '100%' }, mb5]}>
            <View style={[flexRow, justifyBetween, mh10]}>
                <Text style={[commonStyles.h18BlackOne700, {}]}>{productList.find((i: any) => i._id === (item?.productId ?? item?._id))?.name}</Text>
                <Text style={[commonStyles.h18BlackOne700, {}]}>{currencySymbol}{getItemTotal(item).toFixed(2)}</Text>
            </View>
            <View style={[alignItemCenter]}>
                <DashedLine height={300} color={colors.greyTwo} dashLength={10} dashGap={0} />
            </View>
            <View style={[flexRow, alignItemCenter, justifyBetween]}>
                <View style={[p10]}>
                    <Text style={[commonStyles.h12blackTwo600]}>Qty*Rate</Text>
                    <Text style={[commonStyles.h12blackTwo600, mt5]} >Discount & Tax</Text>
                </View>
                <View style={[p10]}>
                    <Text style={[commonStyles.h12blackTwo600]}>
                        {item.quantity} x {item.sellingPrice ?? item?.rate}
                    </Text>
                    <Text style={[commonStyles.h12blackTwo600, mt5]} >
                        {getDiscountAmount(item)}{' '}
                        ({item?.tax?.taxRate}%)
                    </Text>
                </View>
                <View style={[flexRow, alignItemCenter, justifyBetween]}>

                    <TouchableOpacity style={[p10]} onPress={() => openTaxModal(item)}>
                        <CustomIcon
                            color={colors.blackTwo}
                            name="edit"
                            size={14}
                            type="Feather"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={[p10]} onPress={() => deleteItem(item)}>
                        <CustomIcon
                            color={colors.blackTwo}
                            name="delete-forever-outline"
                            size={18}
                            type="MaterialCommunityIcons"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const closeModal = () => {
        getUpdateBank();
        setAddBankDetailsModal(false);
        setAddTaxModal(false);
        SetOpenSignature(false);
    };

    const addSaveBtn = () => {
        getUpdateBank();
        closeModal()
    }
    const getUpdateBank = () => {
        getMethod(
            ApiUrl.dropDownBank,
            success => {
                if (success.code === 200) {
                    dispatch({ type: TYPES.BANK_LIST, payload: success.data });
                    console.log(success.data, "in aupdate bank page");

                }
            },
            error => {
                console.log(error);
            },
        );
    };

    const addSaveSignature = (data: any) => {
        SetOpenSignature(false);
        setSignImage(data)
        setValue('signatureImage', data)
    }

    const signature = [
        {
            id: 1,
            name: 'Manual Signature',
        },
        {
            id: 2,
            name: 'E-Signature',
        },
    ]

    useEffect(() => {
        console.log(SignImage, 'SignIMAGEEE');

    }, [SignImage])
    return (
        <Fragment>
            <SafeAreaView style={getTopNotchStyle(true)} />

            <SafeAreaView style={getMainContainerStyle(false)}>
                <View style={[flex1]}>

                    <View style={[flex1, { backgroundColor: colors.whiteTwo }]}>
                        <CommonDatePicker
                            showDatePickerSingle={showDatePicker}
                            onCancelSingle={handleDateCancel}
                            onConfirmSingle={handleDateConfirm}
                            date={date}
                        />
                        <View style={mh15}>
                            <View style={mv15}>
                                <TopHeader headerText={labels.addPurchaseOrder} />
                            </View>

                            <KeyboardAScrollView showsVerticalScrollIndicator={false}>

                                <View style={{ paddingBottom: '30%' }}>
                                    <View style={[commonStyles.smallCard, mv10]} >
                                        <Text style={[commonStyles.h12RedTwo500, mh10]} > {`Purchase Order ID: ${purchaseOrderId}`}</Text>
                                    </View>
                                    <View style={[flexRow, mt10]}>
                                        <Text style={[commonStyles.h14blackOne600, mv5]} >{labels.referenceNumber}</Text>
                                        <Text style={[commonStyles.h14Danger400]}> *</Text>
                                    </View>
                                    <View style={styles.input}>
                                        <Controller
                                            name={'referenceNo'}
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <CustomTextInput
                                                    placeholder={labels.referenceNumber}
                                                    value={value}
                                                    onChangeText={onChange}
                                                    textColor={colors.black}
                                                    // error={errors['referenceNo']?.message}
                                                    keyboardType='number-pad'
                                                />
                                            )}
                                            rules={{
                                                required: 'Reference Number is required',
                                            }}
                                        />

                                    </View>
                                    {errors.referenceNo && (
                                        <Text style={{ color: colors.danger, marginTop: 2, marginLeft: 10 }}>
                                            {errors.referenceNo.message}
                                        </Text>
                                    )}
                                    <View style={[mv10, mt15]}>
                                        <View style={[flexRow, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={[commonStyles.h14blackOne600, mv5]} >{'Vendor Name'}</Text>
                                                <Text style={[commonStyles.h14Danger400]}> *</Text>
                                            </View>
                                            <TouchableOpacity style={{}} onPress={() => navigation.navigate(screenName.AddVendor as never)}>
                                                <Text style={{ color: colors.primary, }}>Add New</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View >
                                            <Controller
                                                name="vendorId"
                                                control={control}
                                                render={({ field: { onChange, value } }) => (
                                                    <CommonDropDownPicker
                                                        ListData={vendorList}
                                                        dropdownValue={dropdownValue}
                                                        handleDropdownChange={handleDropdownChange}
                                                        isFocus={isFocus}
                                                        setIsFocus={setIsFocus}
                                                        labelField="vendor_name"
                                                        valueField="vendor_name"
                                                        placeholder={labels.vendorName}
                                                    />
                                                )}
                                                rules={{
                                                    required: 'Vendor Name is required',
                                                }}
                                            />

                                        </View>
                                        {errors.vendorId && (
                                            <Text style={{ color: colors.danger, marginTop: 2, marginLeft: 10 }}>
                                                {errors.vendorId.message}
                                            </Text>
                                        )}
                                        <View style={[flexRow, mt10]}>
                                            <Text style={[commonStyles.h14blackOne600, mv5]} >{'Purchase Date'}</Text>
                                            <Text style={[commonStyles.h14Danger400]}> *</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => showDatePickerModal('purchaseOrderDate')} style={[styles.input]}>
                                            <Controller
                                                name={'purchaseOrderDate'}
                                                control={control}
                                                render={({ field: { onChange, value } }) => (
                                                    <CustomTextInput
                                                        textColor={colors.black}
                                                        placeholder={"Select " + labels.purchasesDate}
                                                        value={value}
                                                        onChangeText={onChange}
                                                        // error={errors['purchaseOrderDate']?.message}
                                                        editable={false}
                                                    />
                                                )}
                                                rules={{
                                                    required: 'Purchase Date is required'
                                                }}
                                            />
                                            <View style={[alignSelfCenter]}>
                                                <CustomIcon name='calendar' size={16} color={colors.grey} type='Feather' />
                                            </View>

                                        </TouchableOpacity>
                                        {errors.purchaseOrderDate && (
                                            <Text style={{ color: colors.danger, marginTop: 2, marginLeft: 10 }}>
                                                {errors.purchaseOrderDate.message}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={{ flexDirection: 'column', marginTop: 10 }}>
                                        <View style={[flexRow]}>
                                            <Text style={[commonStyles.h14blackOne600, mv5]} >{'Payment by'}</Text>
                                            <Text style={[commonStyles.h14Danger400]}> *</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => showDatePickerModal('dueDate')} style={[styles.input]}>
                                            <Controller
                                                name={'dueDate'}
                                                control={control}
                                                render={({ field: { onChange, value } }) => (
                                                    <CustomTextInput
                                                        placeholder={"Select " + labels.dueDate}
                                                        value={value}
                                                        onChangeText={onChange}
                                                        // error={errors['dueDate']?.message}
                                                        textColor={colors.black}
                                                        editable={false}
                                                    />
                                                )}
                                                rules={{
                                                    required: 'Due Date is required'
                                                }}
                                            />
                                            <View style={[alignSelfCenter]}>
                                                <CustomIcon name='calendar' size={16} color={colors.grey} type='Feather' />
                                            </View>
                                        </TouchableOpacity>
                                        {errors.dueDate && (
                                            <Text style={{ color: colors.danger, marginTop: 2, marginLeft: 10 }}>
                                                {errors.dueDate.message}
                                            </Text>
                                        )}
                                    </View>
                                    {
                                        addedProduct && addedProduct.length > 0 ? (
                                            <View>
                                                <View style={flexRow}>
                                                    <Text style={[commonStyles.h14blackOne600, mv5]} >{labels.products}</Text>
                                                    <Text style={[commonStyles.h14Danger400]}>*</Text>
                                                </View>
                                                <View style={[{ borderWidth: 1, borderColor: colors.greyTwo, borderRadius: 8 }]}>
                                                    <View style={[flexRow, justifyBetween, alignItemCenter, mv10, mh10]}>
                                                        <View style={[flexRow, justifyBetween, alignItemCenter]}>
                                                            <CustomIcon color={colors.blackTwo} name='chevron-small-up' size={14} type='Entypo' />
                                                            <Text style={[commonStyles.h14BlackTwo400]}>{labels.products}({addedProduct.length})</Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() =>
                                                                (navigation as any).navigate(screenName.ProductScreen, {
                                                                    fromScreen: labels.invoice,
                                                                    listData: productList.filter(
                                                                        (item: any) => !addedProduct.some((i: any) => i._id === item._id)
                                                                    ),
                                                                    handlereturnData: handlereturnData,
                                                                } as any)
                                                            }
                                                        >
                                                            <Text style={[commonStyles.h12Primary400]}>Add Item</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={[alignItemCenter, justifyCenter, {}]}>
                                                        <FlatList
                                                            data={addedProduct}
                                                            renderItem={renderItem}
                                                            keyExtractor={(item) => item?._id?.toString() ?? item?.key}
                                                        />
                                                    </View>
                                                    <View style={[alignItemCenter, mv10]}>
                                                        <DashedLine height={320} color={colors.greyTwo} dashLength={10} dashGap={5} />
                                                    </View>


                                                    <View style={[flexRow, justifyBetween, m10]}>
                                                        <Text style={[commonStyles.h18BlackOne700, {}]}>Total</Text>
                                                        <Text style={[commonStyles.h18BlackOne700, {}]}>{currencySymbol}{((Number(total) || 0) - (Number(discountTotal) || 0) + (Number(taxTotal) || 0)).toFixed(2)}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ) : (
                                            <CustomNavigateBox name='Add Product' label={labels.products} onNavigate={() => (navigation as any).navigate(screenName.ProductScreen, {
                                                fromScreen: labels.invoice,
                                                listData: productList.filter(
                                                    (item: any) => !addedProduct.some((i: any) => i._id === item._id)
                                                ),
                                                handlereturnData: handlereturnData,
                                            } as any)} color={colors.primary} />
                                        )
                                    }
                                    <View>
                                        <View style={[flexRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                            <View style={[flexRow, mt15]}>
                                                <Text style={[commonStyles.h14blackOne600, mv5]} >{'Select Bank'}</Text>
                                                <Text style={[commonStyles.h14Danger400]}> *</Text>
                                            </View>
                                            <TouchableOpacity style={{}} onPress={openModal}>
                                                <Text style={{ color: colors.primary, }}>Add New</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View >
                                            <Controller
                                                name="bank"
                                                control={control}
                                                render={({ field: { onChange, value } }) => (
                                                    <CommonDropDownPicker
                                                        ListData={bankList}
                                                        dropdownValue={dropDownBank}
                                                        handleDropdownChange={handleDropdownBank}
                                                        isFocus={isFocusBank}
                                                        setIsFocus={setIsFocusBank}
                                                        labelField="bankName"
                                                        valueField="bankName"
                                                        placeholder={labels.bankName}
                                                    />
                                                )}
                                                rules={{
                                                    required: 'Bank Name is required',
                                                }}
                                            />
                                        </View>
                                        {errors.bank && (
                                            <Text style={{ color: colors.danger, marginTop: 2, marginLeft: 10 }}>
                                                {errors.bank.message}
                                            </Text>
                                        )}
                                        <Controller
                                            name="notes"
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <MultiLineTextBox
                                                    placeHolder={labels.notes}
                                                    label={labels.notes}
                                                    value={value}
                                                    onChangeValue={onChange}
                                                    multiline={true}
                                                    keyboardType="default"
                                                    height={100}
                                                    maxLength={200}
                                                    disable={false}
                                                    error={errors['notes']?.message}
                                                />
                                            )}
                                            rules={{
                                                required: 'Notes is required',
                                            }}
                                        />
                                        <Controller
                                            name="termsAndCondition"
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <MultiLineTextBox
                                                    placeHolder={labels.terms}
                                                    label={labels.termsConditions}
                                                    value={value}
                                                    onChangeValue={onChange}
                                                    multiline={true}
                                                    keyboardType="default"
                                                    height={100}
                                                    maxLength={200}
                                                    disable={false}
                                                    error={errors['termsAndCondition']?.message}
                                                />
                                            )}
                                            rules={{
                                                required: 'Terms Conditions is required',
                                            }}
                                        />
                                    </View>
                                    <View style={mv10}>
                                        <Text style={commonStyles.h14blackOne600} >Invoice Summary</Text>
                                        <View style={[{ width: '100%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.greyTwo, borderRadius: 8 }, mv10]}>
                                            <View style={[mh10, mv10]}>
                                                <View style={[flexRow, justifyBetween]}>
                                                    <Text style={[commonStyles.h14blackTwo500]}>Amount</Text>
                                                    <Text style={[commonStyles.h14blackTwo500]}>{currencySymbol}{total.toFixed(2)}</Text>
                                                </View>
                                                <View style={[flexRow, justifyBetween, mt10]}>
                                                    <Text style={[commonStyles.h14blackTwo500]}>Discount</Text>
                                                    <Text style={[commonStyles.h14blackTwo500]}>{currencySymbol}{discountTotal.toFixed(2)}</Text>
                                                </View>
                                                <View style={[flexRow, justifyBetween, mt10]}>
                                                    <Text style={[commonStyles.h14blackTwo500]}>Tax</Text>
                                                    <Text style={[commonStyles.h14blackTwo500]}>{currencySymbol}{taxTotal?.toFixed(2)}</Text>
                                                </View>
                                                <View style={[flexRow, justifyBetween, alignItemCenter, mt5]}>
                                                    <View style={[flexRow, justifyCenter, mt10]}>
                                                        <Text style={[commonStyles.h14blackTwo500, mr5]} >Round Off</Text>
                                                        <MultiSelectOption selectedColor={colors.primary} unselectedColor={colors.danger} isSelected={checkBox} onSelect={handleCheckBox} />
                                                    </View>
                                                    <Text style={[commonStyles.h14blackTwo500]}>
                                                        {currencySymbol}{' '}
                                                        {checkBox
                                                            ? (
                                                                Math.round(total - discountTotal + taxTotal) -
                                                                (total - discountTotal + taxTotal)
                                                            ).toFixed(2)
                                                            : '0'}
                                                    </Text>
                                                </View>
                                                <View style={[alignSelfCenter, mv10]}>
                                                    <DashedLine height={300} color={colors.greyEight} dashGap={4} />
                                                </View>
                                                <View style={[flexRow, justifyBetween]}>
                                                    <Text style={[commonStyles.h18BlackOne700, {}]}>Total</Text>
                                                    <Text style={[commonStyles.h18BlackOne700, {}]}>
                                                        {currencySymbol}{checkBox
                                                            ? Math.round(total - discountTotal + taxTotal)
                                                            : (total - discountTotal + taxTotal).toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={mv10}>
                                        <Text style={commonStyles.h14blackOne600} >Signature</Text>
                                        <View style={[flexRow, justifyBetween, alignItemCenter]}>
                                            {
                                                signature.map((item) => {
                                                    return (
                                                        <View style={[flexRow, mv10, { height: 40, width: '48%', borderWidth: 1, borderColor: selectedSignature === item.name ? colors.primary : colors.grey, borderRadius: 8 }, alignItemCenter, justifyStart]} key={item.id}>
                                                            <View style={ml15}>
                                                                <RadioBtn
                                                                    key={item.id}
                                                                    selected={selectedSignature === item.name}
                                                                    onPress={() => handleSignatureSelect(item.name)}
                                                                />
                                                            </View>
                                                            <Text style={[ml10, { color: selectedSignature === item.name ? colors.primary : colors.grey }]}>{item.name}</Text>
                                                        </View>
                                                    )
                                                })
                                            }
                                        </View>
                                    </View>
                                    {selectedSignature && (<>
                                        <View style={[flexRow, mt15]}>
                                            <Text style={[commonStyles.h14blackOne600, mv5]} >{'Select Signature'}</Text>
                                            <Text style={[commonStyles.h14Danger400]}> *</Text>
                                        </View>
                                        {(selectedSignature == "Manual Signature") ?
                                            <View>
                                                <View >
                                                    <Controller
                                                        name="signatureId"
                                                        control={control}
                                                        render={({ field: { onChange, value } }) => (
                                                            <CommonDropDownPicker
                                                                ListData={signatureList}
                                                                dropdownValue={dropDownSignature}
                                                                handleDropdownChange={handleDropdownSignature}
                                                                isFocus={isFocusSignature}
                                                                setIsFocus={setIsFocusSignature}
                                                                labelField="signatureName"
                                                                valueField="signatureName"
                                                                placeholder={labels.select}
                                                            />
                                                        )}
                                                        rules={{
                                                            required: 'Signature is required',
                                                        }}
                                                    />

                                                </View>
                                                {errors.signatureId && (
                                                    <Text style={{ color: colors.danger, marginTop: 2, marginLeft: 10 }}>
                                                        {errors.signatureId.message}
                                                    </Text>
                                                )}
                                            </View> :
                                            <View style={styles.input}>
                                                <Controller
                                                    name={'signatureName'}
                                                    control={control}
                                                    render={({ field: { onChange, value } }) => (
                                                        <CustomTextInput
                                                            placeholder={labels.signatureName}
                                                            value={value}
                                                            onChangeText={onChange}
                                                            textColor={colors.black}
                                                            error={errors['signatureName']?.message}
                                                        />
                                                    )}
                                                    rules={{
                                                        required: requiredValidation('signatureName'),
                                                    }}
                                                />
                                            </View>
                                        }
                                        {SignImage &&
                                            <View style={mv10}>
                                                <Text style={commonStyles.h14blackOne600} >Signature</Text>
                                                <View style={{ padding: 2, borderWidth: 1, borderRadius: 5 }}>
                                                    <Image
                                                        source={{ uri: SignImage }}
                                                        style={{ resizeMode: 'contain', height: 100, width: '100%' }}
                                                    />
                                                </View>
                                            </View>
                                        }
                                    </>)}

                                    <View style={[flexRow, justifyBetween, mt10,]}>
                                        <OnboardingButton
                                            width={160}
                                            title={labels.cancel}
                                            onChange={handleCancelBtnClick}
                                            backgroundColor={colors.greySeven}
                                            color={colors.blackOne}
                                        />
                                        <OnboardingButton
                                            width={160}
                                            title={labels.saveChanges}
                                            onChange={handleSaveBtnClick}
                                            backgroundColor={colors.primary}
                                            color={colors.white}
                                        />
                                    </View>
                                </View>
                            </KeyboardAScrollView>
                        </View>
                        <CustomModal children={<AddBankDetails onSave={addSaveBtn} onCancel={closeModal} />} visible={addBankDetailsModal} onClose={closeModal} height={'80%'} />
                        <CustomModal
                            children={
                                <AddTax
                                    data={editItem}
                                    onSave={EditProduct}
                                    onCancel={closeModal}
                                    taxData={taxList}
                                />
                            }
                            visible={addTaxModal}
                            onClose={closeModal}
                            height={'80%'}
                        />
                        <CustomModal children={<AddSignature onSave={addSaveSignature} onCancel={closeModal} />} visible={OpenSignature} onClose={closeModal} height={'70%'} />
                    </View>
                </View>
            </SafeAreaView>
        </Fragment>

    )
}

const styles = StyleSheet.create({
    bottomButtonsContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingHorizontal: 15,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderColor: colors.greyFive,
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: colors.greyOne,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    formContainer: {
        marginRight: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    shippingAddress: {
        marginTop: 15,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
});

export default AddPurchaseOrderScreen

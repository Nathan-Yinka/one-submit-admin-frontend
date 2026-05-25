import { AiOutlineLoading } from "react-icons/ai";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TextField,
	TableSortLabel,
	TablePagination,
	Select,
	MenuItem as DropdownItem,
	FormControl,
	InputLabel,
	Collapse,
	Menu,
	MenuItem,
	DialogActions,
	DialogContent,
	DialogTitle,
	Dialog,
} from "@mui/material";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { useAllUsers } from "../../hooks/use-all-users";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import { validateForm } from "../../helpers/validate-form";
import { toast } from "sonner";
import { usePostRequestMutation } from "../../services/api/request";
import { ENDPOINT } from "../../constants/endpoint";
import { invalidateRequestTag } from "../../services/api/invalidate-request-tag";
import { Loading } from "../../components/loading";
import { Error } from "../../components/error";
import { BiCopy } from "react-icons/bi";
import { usePacks } from "../../hooks/use-packs";

const AllUsers = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [search, setSearch] = useState("");
	const [sortConfig, setSortConfig] = useState({
		key: "id",
		direction: "asc",
	});
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [page, setPage] = useState(0);
	const [expandedRows, setExpandedRows] = useState({});
	const [filter, setFilter] = useState(
		searchParams.get("order") || "No filter",
	);
	const [generatedCode, setGeneratedCode] = useState("");
	const [anchorEl, setAnchorEl] = useState(null);
	const [hiddenColumns, setHiddenColumns] = useState([]);
	const [selectedImage, setSelectedImage] = useState("");

	const { users, refetchUsers } = useAllUsers();
	const { packs } = usePacks();

	const [tableData, setTableData] = useState([]);

	// Normalize a user record for table/modals
	const transformUser = (item) => ({
		...item,
		gender:
			item?.gender?.toLowerCase() === "m"
				? "Male"
				: item?.gender?.toLowerCase() === "f"
					? "Female"
					: item?.gender,
		phoneNo: item?.phone_number,
		balance: item?.wallet?.balance || 0,
		referralCode: item?.referral_code,
		submissions: `${item?.total_play}/${item?.total_available_play}`,
		active: item?.is_active,
		profit: item?.today_profit || 0,
		total_submission_set:
			item?.number_of_submission_set_today || item?.wallet?.package?.number_of_set
				? `${item?.number_of_submission_set_today}/${item?.wallet?.package?.number_of_set}`
				: `0/0`,
	});

	// Update local table/modal with backend payload if provided
	const updateUserLocal = (rawUser) => {
		if (!rawUser || !rawUser.id) return;
		const transformed = transformUser(rawUser);
		setTableData((prev) => prev.map((row) => (row.id === transformed.id ? transformed : row)));
		if (selectedRow?.id === transformed.id) {
			setSelectedRow(transformed);
		}
	};

	// Fetch latest user snapshot and hydrate selectedRow/table
	const refreshSelectedUser = async () => {
		try {
			if (!selectedRow?.id) return;
			const res = await postSeeMoreInfo({
				url: ENDPOINT.POST_SEE_MORE_INFORMATION,
				body: { user: selectedRow.id },
			}).unwrap();
			if (res?.data) updateUserLocal(res.data);
		} catch (e) {
			// silent fail; UI will keep current values
		}
	};


	useEffect(() => {
		if (users?.data) {
			setTableData(users.data.map((item) => transformUser(item)));
		}
	}, [users?.data]);

	// Keep open modal's selectedRow synced with latest fetched users
	const [unrollDropdownAnchor, setUnrollDropdownAnchor] = useState(null); // State for the dropdown anchor
	const [selectedRow, setSelectedRow] = useState(null); // Keep track of the selected row for modals

	useEffect(() => {
		if (!selectedRow?.id || !users?.data) return;
		const updated = users.data.find((u) => u.id === selectedRow.id);
		if (updated) {
			setSelectedRow(transformUser(updated));
		}
	}, [users?.data, selectedRow?.id]);

	const columns = useMemo(() => {
		return [
			{ Header: "#", accessorKey: "id" },
			{ Header: "Username", accessorKey: "username" },
			{ Header: "Phone No", accessorKey: "phoneNo" },
			{ Header: "Gender", accessorKey: "gender" },
			{ Header: "Balance", accessorKey: "balance" },
			{ Header: "Referral Code", accessorKey: "referralCode" },
			{ Header: "Image", accessorKey: "profile_picture" },
			{ Header: "Today’s submission total", accessorKey: "submissions" },
			{ Header: "Today’s profit", accessorKey: "profit" },
			{
				Header: "Total Submission Set",
				accessorKey: "total_submission_set",
			},
		];
	}, []);

	const handleUnrollDropdownOpen = (event, row) => {
		setUnrollDropdownAnchor(event.currentTarget); // Set dropdown anchor
		setSelectedRow(row); // Track the selected row
	};

	const handleUnrollDropdownClose = () => {
		setUnrollDropdownAnchor(null); // Close dropdown
		setSelectedRow(null); // Reset selected row
	};

	// Login Password
	const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] =
		useState(false);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const handleOpenUpdatePasswordModal = () => {
		setIsUpdatePasswordModalOpen(true);
	};

	const handleCloseUpdatePasswordModal = () => {
		setIsUpdatePasswordModalOpen(false);
	};

	const [postLoginPassword, { isLoading: loadingPostLoginPassword }] =
		usePostRequestMutation();
	const handleSave = async () => {
		const userID = selectedRow.id;

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		try {
			const res = await postLoginPassword({
				url: ENDPOINT.UPDATE_LOGIN_PASSWORD,
				body: {
					user: userID,
					password: password,
				},
			}).unwrap();

			toast.success(res?.message);
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
			setIsUpdatePasswordModalOpen(false);
		} catch (error) {
			console.error(error);
		}
	};

	// Withdrawal Password
	const [
		isUpdateWithdrawalPasswordModalOpen,
		setIsUpdateWithdrawalPasswordModalOpen,
	] = useState(false);
	const [withdrawalPassword, setWithdrawalPassword] = useState("");
	const [confirmWithdrawalPassword, setConfirmWithdrawalPassword] =
		useState("");

	const handleOpenUpdateWithdrawalPasswordModal = () => {
		setIsUpdateWithdrawalPasswordModalOpen(true);
	};

	const handleCloseUpdateWithdrawalPasswordModal = () => {
		setIsUpdateWithdrawalPasswordModalOpen(false);
	};

	const [
		postWithdrawalPassword,
		{ isLoading: loadingPostWithdrawalPassword },
	] = usePostRequestMutation();
	const handleSaveWithdrawalPassword = async () => {
		const userID = selectedRow.id;

		if (withdrawalPassword !== confirmWithdrawalPassword) {
			toast.error("Passwords do not match");
			return;
		}

		try {
			const res = await postWithdrawalPassword({
				url: ENDPOINT.UPDATE_WITHDRAWAL_PASSWORD,
				body: {
					user: userID,
					password: withdrawalPassword,
				},
			}).unwrap();

			toast.success(res?.message);
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
			setIsUpdateWithdrawalPasswordModalOpen(false);
		} catch (error) {
			console.error(error);
		}
	};

	// Customer Balance
	const [
		isUpdateCustomerBalanceModalOpen,
		setIsUpdateCustomerBalanceModalOpen,
	] = useState(false);
	const [customerBalance, setCustomerBalance] = useState(10);
	const [balanceChangeReason, setBalanceChangeReason] = useState("");
	const [adminPassword, setAdminPassword] = useState("");

	const handleOpenUpdateCustomerBalanceModal = () => {
		setIsUpdateCustomerBalanceModalOpen(true);
		refreshSelectedUser();
	};

	const handleCloseUpdateCustomerBalanceModal = () => {
		setIsUpdateCustomerBalanceModalOpen(false);
	};

	const [postCustomerBalance, { isLoading: postingCustomerBalance } ] = usePostRequestMutation();
	const [postCalculateBalance, { isLoading: calculatingBalance }] = usePostRequestMutation();
	const [postCalculateProfit, { isLoading: calculatingProfit }] = usePostRequestMutation();
	const [postCalculateSalary, { isLoading: calculatingSalary }] = usePostRequestMutation();
	const [preview, setPreview] = useState(null);
	const [profitPreview, setProfitPreview] = useState(null);
	const [salaryPreview, setSalaryPreview] = useState(null);
	const previewDebounceRef = useRef(null);
	const profitPreviewDebounceRef = useRef(null);
	const salaryPreviewDebounceRef = useRef(null);

	const handleSaveCustomerBalance = async () => {
		const userID = selectedRow.id;

		const values = {
			user: userID,
			balance: customerBalance,
			reason: balanceChangeReason,
			admin_password: adminPassword,
		};

		if (!validateForm(values)) return;

		try {
			const res = await postCustomerBalance({
				url: ENDPOINT.UPDATE_CUSTOMER_BALANCE,
				body: values,
			}).unwrap();

			toast.success(res?.message);
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
			setIsUpdateCustomerBalanceModalOpen(false);

			setAdminPassword("");
			setBalanceChangeReason("");
			setCustomerBalance("");
			setPreview(null);
		} catch (err) {
			console.error(err);
		}
	};

	// Debounced real-time preview for resulting balance
	useEffect(() => {
		if (!isUpdateCustomerBalanceModalOpen) return;
		if (!selectedRow?.id) return;
		if (customerBalance === "" || customerBalance === null || customerBalance === undefined) {
			setPreview(null);
			return;
		}

		if (previewDebounceRef.current) {
			clearTimeout(previewDebounceRef.current);
		}
		previewDebounceRef.current = setTimeout(async () => {
			try {
				const res = await postCalculateBalance({
					url: ENDPOINT.CALCULATE_CUSTOMER_BALANCE,
					body: {
						user: selectedRow.id,
						balance_adjustment: customerBalance,
					},
				}).unwrap();
				setPreview(res?.data || null);
			} catch (e) {
				setPreview(null);
			}
		}, 500);

		return () => {
			if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
		};
	}, [isUpdateCustomerBalanceModalOpen, selectedRow?.id, customerBalance]);

	const [isUpdateProfitModalOpen, setIsUpdateProfitModalOpen] =
		useState(false);
	const [profitLoginUser, setProfitLoginUser] = useState("");
	const [customerProfit, setCustomerProfit] = useState("");
	const [profitChangeReason, setProfitChangeReason] = useState("");

	const handleOpenUpdateProfitModal = () => {
		setIsUpdateProfitModalOpen(true);
		refreshSelectedUser();
	};

	const handleCloseUpdateProfitModal = () => {
		setIsUpdateProfitModalOpen(false);
	};

	const [isUpdateSalaryModalOpen, setIsUpdateSalaryModalOpen] =
		useState(false);
	const [customerSalary, setCustomerSalary] = useState("");
	const [salaryChangeReason, setSalaryChangeReason] = useState("");

	const handleOpenUpdateSalaryModal = () => {
		setIsUpdateSalaryModalOpen(true);
		refreshSelectedUser();
	};

	const handleCloseUpdateSalaryModal = () => {
		setIsUpdateSalaryModalOpen(false);
	};

	// Debounced real-time preview for resulting profit
	useEffect(() => {
		if (!isUpdateProfitModalOpen) return;
		if (!selectedRow?.id) return;
		if (customerProfit === "" || customerProfit === null || customerProfit === undefined) {
			setProfitPreview(null);
			return;
		}

		if (profitPreviewDebounceRef.current) {
			clearTimeout(profitPreviewDebounceRef.current);
		}
		profitPreviewDebounceRef.current = setTimeout(async () => {
			try {
				const res = await postCalculateProfit({
					url: ENDPOINT.CALCULATE_CUSTOMER_PROFIT,
					body: {
						user: selectedRow.id,
						profit_adjustment: customerProfit,
					},
				}).unwrap();
				setProfitPreview(res?.data || null);
			} catch (e) {
				setProfitPreview(null);
			}
		}, 500);

		return () => {
			if (profitPreviewDebounceRef.current) clearTimeout(profitPreviewDebounceRef.current);
		};
	}, [isUpdateProfitModalOpen, selectedRow?.id, customerProfit]);

	// Debounced real-time preview for resulting salary
	useEffect(() => {
		if (!isUpdateSalaryModalOpen) return;
		if (!selectedRow?.id) return;
		if (customerSalary === "" || customerSalary === null || customerSalary === undefined) {
			setSalaryPreview(null);
			return;
		}

		if (salaryPreviewDebounceRef.current) {
			clearTimeout(salaryPreviewDebounceRef.current);
		}
		salaryPreviewDebounceRef.current = setTimeout(async () => {
			try {
				const res = await postCalculateSalary({
					url: ENDPOINT.CALCULATE_CUSTOMER_SALARY,
					body: {
						user: selectedRow.id,
						salary_adjustment: customerSalary,
					},
				}).unwrap();
				setSalaryPreview(res?.data || null);
			} catch (e) {
				setSalaryPreview(null);
			}
		}, 500);

		return () => {
			if (salaryPreviewDebounceRef.current) clearTimeout(salaryPreviewDebounceRef.current);
		};
	}, [isUpdateSalaryModalOpen, selectedRow?.id, customerSalary]);

	const [postSaveProfit, { isLoading: loadingSaveProfit }] =
		usePostRequestMutation();
	const handleSaveProfit = async () => {
		try {
			const userID = selectedRow.id;

			const values = {
				user: userID,
				profit: customerProfit,
				reason: profitChangeReason,
				admin_password: adminPassword,
			};

			if (!validateForm(values)) return;

			const res = await postSaveProfit({
				url: ENDPOINT.UPDATE_TODAY_PROFIT,
				body: values,
			}).unwrap();

			toast.success(res?.message);
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			setIsUpdateProfitModalOpen(false);
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);

			setAdminPassword("");
			setProfitChangeReason("");
			setCustomerProfit("");
		} catch (err) {
			console.error(err);
		}
	};

	const [postSaveSalary, { isLoading: loadingUpdateSalary }] =
		usePostRequestMutation();
	const handleSaveSalary = async () => {
		try {
			const userID = selectedRow.id;

			const values = {
				user: userID,
				salary: customerSalary,
				reason: salaryChangeReason,
				admin_password: adminPassword,
			};

			if (!validateForm(values)) return;

			const res = await postSaveSalary({
				url: ENDPOINT.UPDATE_TODAY_SALARY,
				body: values,
			}).unwrap();

			toast.success(res?.message);
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			setIsUpdateSalaryModalOpen(false);
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);

			setCustomerSalary("");
			setSalaryChangeReason("");
			setAdminPassword("");
		} catch (err) {
			console.error(err);
		}
	};

	// Update Credit Score
	const [creditScore, setCreditScore] = useState("");
	const [isUpdateCreditScoreModalOpen, setIsUpdateCreditScoreModalOpen] =
		useState(false);
	const handleOpenUpdateCreditScoreModal = () => {
		setIsUpdateCreditScoreModalOpen(true);
	};

	const handleCloseUpdateCreditScoreModal = () => {
		setIsUpdateCreditScoreModalOpen(false);
	};

	const [postUpdateCreditScore, { isLoading: loadingUpdateCreditScore }] =
		usePostRequestMutation();
	const handleUpdateCreditScore = async () => {
		try {
			const userID = selectedRow.id;

			const formValues = {
				user: userID,
				credit_score: creditScore,
				admin_password: adminPassword,
			};

			if (!validateForm(formValues, ["user"])) return;

			const res = await postUpdateCreditScore({
				url: ENDPOINT.POST_UPDATE_CREDIT_SCORE,
				body: formValues,
			}).unwrap();

			toast?.success(res?.message);
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();

			setCreditScore("");
			setAdminPassword("");

			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
			setIsUpdateCreditScoreModalOpen(false);
		} catch (err) {
			console.error(err);
		}
	};

	const [isResetAccountModalOpen, setIsResetAccountModalOpen] =
		useState(false);
	const [submissionCount, setSubmissionCount] = useState("");
	const [setCount, setSetCount] = useState("");
	const [resetAdminPassword, setResetAdminPassword] = useState("");
	const [submissionCountError, setSubmissionCountError] = useState("");
	const [setCountError, setSetCountError] = useState("");

	const handleOpenResetAccountModal = () => {
		setIsResetAccountModalOpen(true);
		refreshSelectedUser();
		// Reset form fields
		setSubmissionCount("");
		setSetCount("");
		setResetAdminPassword("");
		setSubmissionCountError("");
		setSetCountError("");
	};

	const handleCloseResetAccountModal = () => {
		setIsResetAccountModalOpen(false);
		setSubmissionCount("");
		setSetCount("");
		setResetAdminPassword("");
		setSubmissionCountError("");
		setSetCountError("");
	};

	// Pure validation functions that don't update state
	const validateSubmissionCountPure = (value) => {
		if (value === "") {
			return { isValid: true, error: "" };
		}
		
		const numValue = parseInt(value);
		const dailyMissions = selectedRow?.daily_missions || selectedRow?.wallet?.package?.daily_missions;
		
		if (isNaN(numValue) || numValue < 0) {
			return { isValid: false, error: "Submission count must be a non-negative number" };
		}
		
		if (dailyMissions && numValue > dailyMissions) {
			return { isValid: false, error: `Cannot exceed package daily missions limit (${dailyMissions})` };
		}
		
		return { isValid: true, error: "" };
	};

	const validateSetCountPure = (value) => {
		if (value === "") {
			return { isValid: true, error: "" };
		}
		
		const numValue = parseInt(value);
		const numberOfSet = selectedRow?.number_of_set || selectedRow?.wallet?.package?.number_of_set;
		
		if (isNaN(numValue) || numValue < 0) {
			return { isValid: false, error: "Set count must be a non-negative number" };
		}
		
		if (numberOfSet && numValue > numberOfSet) {
			return { isValid: false, error: `Cannot exceed package number of sets limit (${numberOfSet})` };
		}
		
		return { isValid: true, error: "" };
	};

	// Validation functions that update state
	const validateSubmissionCount = (value) => {
		const result = validateSubmissionCountPure(value);
		setSubmissionCountError(result.error);
		return result.isValid;
	};

	const validateSetCount = (value) => {
		const result = validateSetCountPure(value);
		setSetCountError(result.error);
		return result.isValid;
	};

	// Check if form is valid using useMemo to prevent infinite re-renders
	const isFormValid = useMemo(() => {
		const submissionResult = validateSubmissionCountPure(submissionCount);
		const setResult = validateSetCountPure(setCount);
		
		return resetAdminPassword.trim() !== "" && submissionResult.isValid && setResult.isValid;
	}, [resetAdminPassword, submissionCount, setCount, selectedRow]);

	const [postResetAccount, { isLoading: loadingResetAccount }] =
		usePostRequestMutation();
	const handleSaveResetAccount = async () => {
		try {
			// Additional safety check
			if (!selectedRow?.id) {
				toast.error("No user selected");
				return;
			}

			const userID = selectedRow.id;

			// Validate all fields
			const isSubmissionValid = validateSubmissionCount(submissionCount);
			const isSetValid = validateSetCount(setCount);

			if (!isSubmissionValid || !isSetValid) {
				toast.error("Please fix validation errors before submitting");
				return;
			}

			const formValues = {
				user: userID,
				admin_password: resetAdminPassword,
			};

			// Add optional fields if provided
			if (submissionCount !== "") {
				formValues.submission_count = parseInt(submissionCount);
			}
			if (setCount !== "") {
				formValues.set_count = parseInt(setCount);
			}

			if (!validateForm(formValues)) return;

			const res = await postResetAccount({
				url: ENDPOINT.POST_REST_ACCOUNT_FOR_TASK,
				body: formValues,
			}).unwrap();

			toast?.success(res?.message);
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();

			setResetAdminPassword("");
			setSubmissionCount("");
			setSetCount("");
			setSubmissionCountError("");
			setSetCountError("");
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
			setIsResetAccountModalOpen(false);
		} catch (err) {
			console.error("Reset account error:", err);
			// Error handling is done by the global transformErrorResponse in request.js
		}
	};

	const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
	const [userInfo, setUserInfo] = useState({
		username: "test",
		fullName: "N/A",
		trcAddress: "N/A",
		trcPhone: "N/A",
		exchange: "N/A",
		email: "N/A",
	});

	const handleOpenUserInfoModal = (row) => {
		handleSeeMoreInfo();
		setIsUserInfoModalOpen(true);
	};

	const handleCloseUserInfoModal = () => {
		setIsUserInfoModalOpen(false);
		setUserInfo({});
	};

	const [isRemoveBonusModalOpen, setIsRemoveBonusModalOpen] = useState(false);

	const handleOpenRemoveBonusModal = (row) => {
		setSelectedRow(row); // Set the selected row data
		setIsRemoveBonusModalOpen(true);
	};

	const handleCloseRemoveBonusModal = () => {
		setIsRemoveBonusModalOpen(false);
	};

	const [isDeactivateBalanceModalOpen, setIsDeactivateBalanceModalOpen] =
		useState(false);

	// Package Update Modal State
	const [isUpdatePackageModalOpen, setIsUpdatePackageModalOpen] = useState(false);
	const [selectedPackage, setSelectedPackage] = useState("");
	const [packageAdminPassword, setPackageAdminPassword] = useState("");
	const [availablePacks, setAvailablePacks] = useState([]);

	const handleOpenDeactivateBalanceModal = () => {
		setIsDeactivateBalanceModalOpen(true);
	};

	const handleCloseDeactivateBalanceModal = () => {
		setIsDeactivateBalanceModalOpen(false);
	};

	// Package Update Modal Handlers
	const handleOpenUpdatePackageModal = () => {
		setIsUpdatePackageModalOpen(true);
		// Fetch available packs when opening modal
		fetchActivePacks();
	};

	const handleCloseUpdatePackageModal = () => {
		setIsUpdatePackageModalOpen(false);
		setSelectedPackage("");
		setPackageAdminPassword("");
	};

	const handleExportPDF = () => {
		const doc = new jsPDF();
		autoTable(doc, {
			head: [columns.map((col) => col.Header)],
			body: tableData.map((row) =>
				columns.map((col) =>
					col.accessorKey === "active"
						? row[col.accessorKey]
							? "Yes"
							: "No"
						: row[col.accessorKey],
				),
			),
		});
		doc.save("allusers-data.pdf");
	};

	const handleExportCSV = () => {
		const csvData = [
			columns.map((col) => col.Header).join(","),
			...tableData.map((row) =>
				columns
					.map((col) =>
						col.accessorKey === "active"
							? row[col.accessorKey]
								? "Yes"
								: "No"
							: row[col.accessorKey],
					)
					.join(","),
			),
		].join("\n");
		const blob = new Blob([csvData], { type: "text/csv" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = "allusers-data.csv";
		link.click();
	};

	const handleMenuOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleColumnToggle = (key) => {
		setHiddenColumns((prev) =>
			prev.includes(key)
				? prev.filter((col) => col !== key)
				: [...prev, key],
		);
	};

	const handleSort = (key) => {
		console.log('Sorting by:', key);
		setSortConfig((prevConfig) => {
			const newConfig = {
				key,
				direction:
					prevConfig.key === key && prevConfig.direction === "asc"
						? "desc"
						: "asc",
			};
			console.log('New sort config:', newConfig);
			return newConfig;
		});
	};

	const handleSearch = (e) => {
		setSearch(e.target.value);
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleExpandRow = (id) => {
		setExpandedRows((prevState) => ({
			...prevState,
			[id]: !prevState[id],
		}));
	};

	const handleFilterChange = (event) => {
		const value = event.target.value;
		setFilter(value);

		setSearchParams({
			...Object.fromEntries(searchParams.entries()),
			order: value,
		});

		// Apply the sorting based on the selected filter
		if (value !== "No filter") {
			// Extract the field name and direction from the value
			const isDescending = value.startsWith('-');
			const fieldName = isDescending ? value.substring(1) : value;
			
			// Map the field names to actual data fields
			let sortKey;
			let sortDirection = isDescending ? 'desc' : 'asc';
			
			switch (fieldName) {
				case 'wallet_commission':
					sortKey = 'wallet_commission';
					break;
				case 'total_games_played':
					sortKey = 'total_play';
					break;
				case 'total_negative_product':
					sortKey = 'total_negative_product';
					break;
				default:
					sortKey = fieldName;
			}
			
			setSortConfig({
				key: sortKey,
				direction: sortDirection
			});
		} else {
			// Reset to default sorting
			setSortConfig({
				key: "id",
				direction: "asc"
			});
		}
	};

	const [postGenerateCode, { isLoading: loadingGenerateCode }] =
		usePostRequestMutation();
	const handleGenerateCode = async () => {
		setGeneratedCode("");

		try {
			const res = await postGenerateCode({
				url: ENDPOINT.POST_GENERATE_CODE,
			}).unwrap();

			toast.success(res?.message);
			setGeneratedCode(res?.data?.invitation_code);
		} catch (err) {
			console.error(err);
		}
	};

	const [postToggleRegBonus, { isLoading: loadingToggleRegBonus }] =
		usePostRequestMutation();

	const handleRemoveRegistrationBonus = async () => {
		try {
			const userID = selectedRow.id;

			const formData = {
				user: userID,
				admin_password: adminPassword,
			};

			if (!validateForm(formData)) return;

			const res = await postToggleRegBonus({
				url: ENDPOINT.UPDATE_REG_BONUS,
				body: formData,
			}).unwrap();

			toast.success(res?.message);

			setSelectedRow({
				...selectedRow,
				is_reg_balance_add: res?.data?.is_reg_balance_add,
			});

			setAdminPassword("");
			handleCloseRemoveBonusModal();

			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
		} catch (err) {
			console.error(err);
		}
	};

	const [postToggleMinBalance, { isLoading: loadingToggleMinBalance }] =
		usePostRequestMutation();
	const handleToggleMinBalance = async () => {
		try {
			const res = await postToggleMinBalance({
				url: ENDPOINT.UPDATE_MIN_BALANCE,
				body: {
					user: selectedRow.id,
				},
			}).unwrap();

			toast.success(res?.message);

			setSelectedRow({
				...selectedRow,
				is_min_balance_for_submission_removed:
					res?.data?.is_min_balance_for_submission_removed,
			});
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
			handleCloseDeactivateBalanceModal();
		} catch (err) {
			console.error(err);
		}
	};

	const [postSeeMoreInfo, { isLoading: loadingSeeMoreInfo }] =
		usePostRequestMutation();

	const handleSeeMoreInfo = async () => {
		try {
			const userID = selectedRow?.id;

			const res = await postSeeMoreInfo({
				url: ENDPOINT.POST_SEE_MORE_INFORMATION,
				body: {
					user: userID,
				},
			}).unwrap();

			setUserInfo(res?.data);
		} catch (err) {
			console.error(err);
		}
	};

	const [postUserActive, { isLoading: loadingUserActive }] =
		usePostRequestMutation();
	const handleToggleUserActive = async (userID) => {
		try {
			const res = await postUserActive({
				url: ENDPOINT.POST_USER_ACTIVE,
				body: {
					user: userID,
				},
			}).unwrap();

			toast.success(res?.message);
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
		} catch (err) {
			console.error(err);
		}
	};

	// Package Update API Functions
	const [postUpdateUserPackage, { isLoading: loadingUpdatePackage }] =
		usePostRequestMutation();

	const fetchActivePacks = () => {
		if (packs?.data) {
			const activePacks = packs.data.filter(pack => pack.is_active);
			setAvailablePacks(activePacks);
		}
	};

	const handleUpdateUserPackage = async () => {
		try {
			if (!selectedPackage || !packageAdminPassword) {
				toast.error('Please fill in all fields');
				return;
			}

			const res = await postUpdateUserPackage({
				url: ENDPOINT.POST_UPDATE_USER_PACKAGE,
				body: {
					user: selectedRow?.id,
					pack_id: selectedPackage,
					admin_password: packageAdminPassword,
				},
			}).unwrap();

			toast.success(res?.message || 'Package updated successfully');
			if (res?.data) updateUserLocal(res.data);
			else await refetchUsers();
			invalidateRequestTag(ENDPOINT.GET_ALL_USERS);
			handleCloseUpdatePackageModal();
		} catch (err) {
			console.error(err);
			toast.error(err?.data?.message || 'Failed to update package');
		}
	};

	const filteredData = useMemo(() => {
		return tableData.filter((row) => {
			const searchLower = search.toLowerCase();

			return Object.values(row).some((value) =>
				String(value).toLowerCase().includes(searchLower),
			);
		});
	}, [search, tableData]);

	const sortedData = useMemo(() => {
		const sorted = [...filteredData];
		if (sortConfig.key) {
			console.log('Sorting data with key:', sortConfig.key, 'direction:', sortConfig.direction);
			console.log('Sample data before sort:', sorted.slice(0, 2));
			sorted.sort((a, b) => {
				let aValue, bValue;

				// Handle different data types and transformations
				switch (sortConfig.key) {
					case 'id':
						aValue = parseInt(a.id) || 0;
						bValue = parseInt(b.id) || 0;
						break;
					case 'username':
						aValue = (a.username || '').toLowerCase();
						bValue = (b.username || '').toLowerCase();
						break;
					case 'phoneNo':
						aValue = (a.phone_number || '').toLowerCase();
						bValue = (b.phone_number || '').toLowerCase();
						break;
					case 'gender':
						aValue = (a.gender || '').toLowerCase();
						bValue = (b.gender || '').toLowerCase();
						break;
					case 'balance':
						aValue = parseFloat(a.wallet?.balance || 0);
						bValue = parseFloat(b.wallet?.balance || 0);
						break;
					case 'referralCode':
						aValue = (a.referral_code || '').toLowerCase();
						bValue = (b.referral_code || '').toLowerCase();
						break;
					case 'submissions':
						// Extract total_play for sorting
						aValue = parseInt(a.total_play || 0);
						bValue = parseInt(b.total_play || 0);
						break;
					case 'profit':
						aValue = parseFloat(a.today_profit || 0);
						bValue = parseFloat(b.today_profit || 0);
						break;
				case 'total_submission_set':
					// Extract number_of_submission_set_today for sorting
					aValue = parseInt(a.number_of_submission_set_today || 0);
					bValue = parseInt(b.number_of_submission_set_today || 0);
					break;
				case 'wallet_commission':
					aValue = parseFloat(a.wallet_commission || 0);
					bValue = parseFloat(b.wallet_commission || 0);
					break;
				case 'total_play':
					aValue = parseInt(a.total_play || 0);
					bValue = parseInt(b.total_play || 0);
					break;
				case 'total_negative_product':
					aValue = parseInt(a.total_negative_product || 0);
					bValue = parseInt(b.total_negative_product || 0);
					break;
				case 'today_profit':
					aValue = parseFloat(a.today_profit || 0);
					bValue = parseFloat(b.today_profit || 0);
					break;
				case 'number_of_submission_set_today':
					aValue = parseInt(a.number_of_submission_set_today || 0);
					bValue = parseInt(b.number_of_submission_set_today || 0);
					break;
				default:
					aValue = a[sortConfig.key] || '';
					bValue = b[sortConfig.key] || '';
				}

				// Handle numeric comparisons
				if (typeof aValue === 'number' && typeof bValue === 'number') {
					if (aValue < bValue) {
						return sortConfig.direction === "asc" ? -1 : 1;
					}
					if (aValue > bValue) {
						return sortConfig.direction === "asc" ? 1 : -1;
					}
					return 0;
				}

				// Handle string comparisons
				if (aValue < bValue) {
					return sortConfig.direction === "asc" ? -1 : 1;
				}
				if (aValue > bValue) {
					return sortConfig.direction === "asc" ? 1 : -1;
				}
				return 0;
			});
			console.log('Sample data after sort:', sorted.slice(0, 2));
		}
		return sorted;
	}, [filteredData, sortConfig]);

	const displayedData = sortedData.slice(
		page * rowsPerPage,
		page * rowsPerPage + rowsPerPage,
	);

	if (users.isLoading) {
		return <Loading />;
	}
	if (users.isError) {
		return <Error retry={refetchUsers} />;
	}

	return (
		<div className="p-2 bg-gray-100 md:p-4">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-semibold text-gray-700">Users List</h1>
				<nav className="text-sm text-gray-500">
					<span>Musosoup</span> /{" "}
					<span className="text-gray-700">Users List</span>
				</nav>
			</div>
			<div className="flex flex-wrap items-center gap-4 mb-4">
				{/* Left side - Controls */}
				<div className="flex items-center gap-2">
					<FormControl size="small">
						<InputLabel>Sort By Order</InputLabel>

						<Select value={filter} onChange={handleFilterChange}>
							<DropdownItem value="No filter">No filter</DropdownItem>

							<DropdownItem value="-wallet_commission">
								Highest income
							</DropdownItem>

							<DropdownItem value="-total_play">
								Total products submitted descending
							</DropdownItem>

							<DropdownItem value="-total_negative_product">
								Total negative products descending
							</DropdownItem>

							<DropdownItem value="-today_profit">
								Highest profit today
							</DropdownItem>

							<DropdownItem value="-balance">
								Highest balance
							</DropdownItem>

							<DropdownItem value="-number_of_submission_set_today">
								Most submission sets today
							</DropdownItem>
						</Select>
					</FormControl>

					<Button
						className="h-10"
						variant="contained"
						color="warning"
						onClick={handleExportCSV}
						size="small"
					>
						Export CSV
					</Button>

					<Button
						className="h-10"
						variant="contained"
						color="error"
						onClick={handleExportPDF}
						size="small"
					>
						Export PDF
					</Button>

					<Button
						className="h-10"
						variant="contained"
						color="info"
						size="small"
						onClick={handleMenuOpen}
					>
						Column Visibility
					</Button>
				</div>

				{/* Middle - Invitation Code */}
				<div className="flex items-center gap-2">
					<div className="relative">
						<TextField
							size="small"
							InputProps={{
								readOnly: true,
							}}
							value={generatedCode}
							sx={{ minWidth: '200px' }}
						/>

						<div className="absolute right-0 -translate-y-1/2 top-1/2">
							{generatedCode && (
								<Button
									color="primary"
									onClick={() => {
										navigator.clipboard.writeText(generatedCode);
										toast.success("Copied");
									}}
									style={{ textTransform: "none", fontSize: "14px" }}
									className="h-full"
								>
									<BiCopy className="size-6" />
								</Button>
							)}
						</div>
					</div>

					<Button
						onClick={handleGenerateCode}
						color="success"
						variant="contained"
						size="small"
						disabled={loadingGenerateCode}
						style={{
							fontSize: "14px",
							textTransform: "none",
							gap: "10px",
						}}
					>
						{loadingGenerateCode && (
							<AiOutlineLoading className="animate-spin" />
						)}
						Generate an invitation code
					</Button>
				</div>

				{/* Right side - Search */}
				<TextField
					variant="outlined"
					placeholder="Search"
					size="small"
					style={{ marginLeft: "auto" }}
					value={search}
					onChange={handleSearch}
				/>

				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl)}
					onClose={handleMenuClose}
				>
					{columns.map(
						(col) =>
							col.accessorKey !== "actions" && (
								<MenuItem
									key={col.accessorKey}
									onClick={() => handleColumnToggle(col.accessorKey)}
								>
									{col.Header}
								</MenuItem>
							),
					)}
				</Menu>
			</div>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							{columns
								.filter(
									(column) =>
										!hiddenColumns.includes(column.accessorKey),
								) // Filter out hidden columns
								.map((column) => (
									<TableCell key={column.accessorKey}>
										{column.accessorKey !== "actions" ? (
											<TableSortLabel
												active={
													sortConfig.key === column.accessorKey
												}
												direction={
													sortConfig.key === column.accessorKey
														? sortConfig.direction
														: "asc"
												}
												onClick={() =>
													handleSort(column.accessorKey)
												}
											>
												{column.Header}
											</TableSortLabel>
										) : (
											column.Header
										)}
									</TableCell>
								))}
						</TableRow>
					</TableHead>
					<TableBody>
						{displayedData.map((row, index) => (
							<React.Fragment key={row.id}>
								<TableRow>
									{/* Combined + button and row number with reduced width */}
									<TableCell
										style={{
											width: "50px",
											textAlign: "center",
											padding: "4px",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
											}}
										>
											<Button
												size="small"
												onClick={() => handleExpandRow(row.id)}
												style={{ minWidth: "25px", padding: "0" }}
											>
												{expandedRows[row.id] ? "-" : "+"}
											</Button>
											<span style={{ marginLeft: "4px" }}>
												{index + 1}
											</span>
										</div>
									</TableCell>

									{columns
										.filter(
											(column) =>
												!hiddenColumns.includes(column.accessorKey),
										) // Filter out hidden columns
										.map((column) =>
											column.accessorKey !== "id" &&
												column.accessorKey !== "profile_picture" ? (
												<TableCell key={column.accessorKey}>
													{row[column.accessorKey]}
												</TableCell>
											) : column.accessorKey ===
												"profile_picture" ? (
												<img
													src={
														row[column.accessorKey]
															? row[column.accessorKey]
															: "/empty-user.jpg"
													}
													alt={`Screenshot ${row.id}`}
													className="object-cover w-auto h-12 cursor-pointer"
													onClick={() =>
														setSelectedImage(
															row[column.accessorKey],
														)
													}
												/>
											) : null,
										)}
								</TableRow>

								<TableRow>
									<TableCell
										colSpan={
											columns.filter(
												(col) =>
													!hiddenColumns.includes(col.accessorKey),
											).length
										} // Adjust colspan
										style={{ padding: 0 }}
									>
										<Collapse in={expandedRows[row.id]}>
											<div className="p-4">
												<p>
													<strong>
														Total products submitted:
													</strong>{" "}
													{row?.total_product_submitted}
												</p>
												<p>
													<strong>
														Total negative products submitted:
													</strong>{" "}
													{row?.total_negative_product_submitted}
												</p>
												<p>
													<strong>Total wallet commision:</strong>{" "}
													{row?.wallet?.commission}
												</p>
												<p>
													<strong>On hold:</strong>{" "}
													{row?.wallet?.on_hold}
												</p>
												<p>
													<strong>Salary:</strong>{" "}
													{row?.wallet?.salary}
												</p>
												<p>
													<strong>Level:</strong>{" "}
													{row?.wallet?.package?.name}
												</p>
												<p>
													<strong>Last connection:</strong>{" "}
													{moment(row?.last_connection).format(
														"DD MMM YYYY h:mm A",
													) || "N/A"}
												</p>

												<p className="flex items-center gap-2">
													<strong className="flex items-center gap-2">
														{loadingUserActive && (
															<AiOutlineLoading className="animate-spin" />
														)}{" "}
														Active:
													</strong>{" "}
													<input
														type="checkbox"
														disabled={loadingUserActive}
														checked={row?.active}
														onChange={() =>
															handleToggleUserActive(row?.id)
														}
													/>
												</p>
												<Button
													size="small"
													variant="contained"
													color="secondary"
													onClick={(event) =>
														handleUnrollDropdownOpen(event, row)
													}
												>
													Unroll
												</Button>
												<Menu
													anchorEl={unrollDropdownAnchor}
													open={Boolean(unrollDropdownAnchor)}
													onClose={handleUnrollDropdownClose}
												>
													<MenuItem
														onClick={() => {
															handleOpenUpdatePasswordModal(
																selectedRow,
															);
														}}
													>
														Update login password
													</MenuItem>

													<MenuItem
														onClick={() => {
															handleOpenUpdateWithdrawalPasswordModal(
																selectedRow,
															);
														}}
													>
														Update withdrawal password
													</MenuItem>

													<MenuItem
														onClick={() => {
															handleOpenUpdateCustomerBalanceModal(
																selectedRow,
															);
															// setCustomerBalance(
															// 	selectedRow?.balance,
															// );
														}}
													>
														Update customer balance
													</MenuItem>

													<MenuItem
														onClick={() => {
															handleOpenUpdateProfitModal(
																selectedRow,
															);
															// setCustomerProfit(
															// 	selectedRow?.profit,
															// );
														}}
													>
														Update Today’s profit
													</MenuItem>

													<MenuItem
														onClick={() => {
															handleOpenUpdateSalaryModal(
																selectedRow,
															);
															// setCustomerSalary(
															// 	selectedRow?.wallet?.salary,
															// );
														}}
													>
														Update Today’s salary
													</MenuItem>

													<MenuItem
														onClick={() => {
															handleOpenUpdateCreditScoreModal(
																selectedRow,
															);
															setCreditScore(
																selectedRow?.wallet
																	?.credit_score,
															);
														}}
													>
														Update Credit Score
													</MenuItem>

													<MenuItem
														onClick={() => {
															handleOpenResetAccountModal(
																selectedRow,
															);
														}}
													>
														Reset account to start a new task
													</MenuItem>

													<MenuItem
														onClick={() =>
															handleOpenUserInfoModal(
																selectedRow,
															)
														}
													>
														See more information
													</MenuItem>

													<MenuItem
														onClick={() =>
															handleOpenUpdatePackageModal()
														}
													>
														Update Package
													</MenuItem>

													<MenuItem
														onClick={() =>
															handleOpenRemoveBonusModal(
																selectedRow,
															)
														}
													>
														{selectedRow?.is_reg_balance_add
															? "Remove"
															: "Add"}{" "}
														registration bonus
													</MenuItem>

													<MenuItem
														onClick={
															handleOpenDeactivateBalanceModal
														}
													>
														{selectedRow?.is_min_balance_for_submission_removed
															? "Enable"
															: "Disable"}{" "}
														minimum balance for submissions
													</MenuItem>
												</Menu>
											</div>
										</Collapse>
									</TableCell>
								</TableRow>
							</React.Fragment>
						))}
					</TableBody>
				</Table>

				<TablePagination
					rowsPerPageOptions={[5, 10, 25]}
					component="div"
					count={tableData.length}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
				/>
			</TableContainer>

			<Dialog
				open={isUpdatePasswordModalOpen}
				onClose={handleCloseUpdatePasswordModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Update Login Password</DialogTitle>
				<DialogContent>
					<div className="grid grid-cols-2 gap-4 mt-4">
						<TextField
							label="User"
							fullWidth
							disabled
							value={selectedRow?.username}
						/>

						<TextField
							label="Password"
							type="password"
							fullWidth
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<TextField
							label="Confirm Password"
							type="password"
							fullWidth
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</div>
				</DialogContent>

				<DialogActions>
					<Button
						disabled={loadingPostLoginPassword}
						onClick={handleCloseUpdatePasswordModal}
						color="warning"
						variant="outlined"
					>
						Close
					</Button>

					<Button
						disabled={loadingPostLoginPassword}
						onClick={handleSave}
						color="primary"
						variant="contained"
						sx={{
							gap: "10px",
						}}
					>
						{loadingPostLoginPassword && (
							<AiOutlineLoading className="animate-spin " />
						)}{" "}
						Save
					</Button>
				</DialogActions>
			</Dialog>

			{/* Update Withdrawal Password Modal */}
			<Dialog
				open={isUpdateWithdrawalPasswordModalOpen}
				onClose={handleCloseUpdateWithdrawalPasswordModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Update Withdrawal Password</DialogTitle>
				<DialogContent>
					<div className="grid grid-cols-2 gap-4 mt-4">
						<TextField
							label="User"
							fullWidth
							disabled
							value={selectedRow?.username}
						/>

						<TextField
							label="Withdrawal password"
							type="password"
							fullWidth
							value={withdrawalPassword}
							onChange={(e) => setWithdrawalPassword(e.target.value)}
						/>
						<TextField
							label="Confirm withdrawal password"
							type="password"
							fullWidth
							value={confirmWithdrawalPassword}
							onChange={(e) =>
								setConfirmWithdrawalPassword(e.target.value)
							}
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleCloseUpdateWithdrawalPasswordModal}
						color="warning"
						disabled={loadingPostWithdrawalPassword}
						variant="outlined"
					>
						Close
					</Button>
					<Button
						onClick={handleSaveWithdrawalPassword}
						color="primary"
						disabled={loadingPostWithdrawalPassword}
						variant="contained"
						sx={{
							gap: "10px",
						}}
					>
						{loadingPostWithdrawalPassword && (
							<AiOutlineLoading className="animate-spin " />
						)}{" "}
						Save
					</Button>
				</DialogActions>
			</Dialog>

			{/* Update Customer Balance Modal */}
			<Dialog
				open={isUpdateCustomerBalanceModalOpen}
				onClose={handleCloseUpdateCustomerBalanceModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Update Customer Balance</DialogTitle>
				<DialogContent>
					<div className="grid grid-cols-1 gap-4">
						<TextField
							label="User"
							fullWidth
							disabled
							margin="dense"
							value={selectedRow?.username}
						/>

						<TextField
							label="Current Customer Balance"
							fullWidth
							type="number"
							value={selectedRow?.balance}
							disabled
						/>

						<TextField
							label="Update Customer Balance"
							fullWidth
							type="number"
							value={customerBalance}
							onChange={(e) => setCustomerBalance(e.target.value)}
						/>
						<TextField
							label="Reason for change"
							fullWidth
							value={balanceChangeReason}
							onChange={(e) => setBalanceChangeReason(e.target.value)}
						/>
						<TextField
							label="Administrateur password"
							type="password"
							fullWidth
							value={adminPassword}
							onChange={(e) => setAdminPassword(e.target.value)}
						/>
					</div>
					{/* Real-time Preview Resulting Balance */}
					<div className="rounded-lg border p-3 text-sm bg-gray-50">
						<div className="flex items-center justify-between mb-2">
							<span className="font-medium text-gray-700">Preview resulting balance</span>
							{calculatingBalance && <AiOutlineLoading className="animate-spin" />}
						</div>
						{preview ? (
							<div className="grid grid-cols-2 gap-3">
								<div>
									<p className="text-gray-500">Current balance</p>
									<p className="font-semibold">{Number(preview.current_balance).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Current on-hold</p>
									<p className="font-semibold">{Number(preview.current_on_hold).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Adjustment</p>
									<p className="font-semibold">{Number(preview.balance_adjustment).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Resulting balance</p>
									<p className="font-semibold text-primary">{Number(preview.resulting_balance).toFixed(2)}</p>
								</div>
								<div className="col-span-2 text-xs text-gray-600">
									{preview.negative_balance_cleared && <p>Negative balance will be cleared.</p>}
									{preview.on_hold_moved_to_balance && <p>Frozen funds will be released to balance.</p>}
								</div>
							</div>
						) : (
							<p className="text-xs text-gray-500">Type an amount to see the preview.</p>
						)}
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						disabled={postingCustomerBalance}
						onClick={handleCloseUpdateCustomerBalanceModal}
						color="warning"
						variant="outlined"
					>
						Close
					</Button>
					<Button
						disabled={postingCustomerBalance}
						onClick={handleSaveCustomerBalance}
						color="primary"
						variant="contained"
					>
						{postingCustomerBalance && (
							<AiOutlineLoading className="animate-spin " />
						)}{" "}
						Save
					</Button>
				</DialogActions>
			</Dialog>

			{/* Update Today's Profit Modal */}
			<Dialog
				open={isUpdateProfitModalOpen}
				onClose={handleCloseUpdateProfitModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Update today's profit</DialogTitle>
				<DialogContent>
					<div className="grid grid-cols-1 gap-4">
						<TextField
							label="User"
							fullWidth
							disabled
							margin="dense"
							value={selectedRow?.username}
						/>

						<TextField
							label="Current CUstomer Todays Profit"
							fullWidth
							type="number"
							value={selectedRow?.profit}
							disabled
						/>

						<TextField
							label="Update Customer Today's profit"
							fullWidth
							type="number"
							value={customerProfit}
							onChange={(e) => setCustomerProfit(e.target.value)}
						/>
						<TextField
							label="Reason for change"
							fullWidth
							value={profitChangeReason}
							onChange={(e) => setProfitChangeReason(e.target.value)}
						/>
						<TextField
							label="Administrateur password"
							type="password"
							fullWidth
							value={adminPassword}
							onChange={(e) => setAdminPassword(e.target.value)}
						/>
					</div>
					{/* Real-time Preview Resulting Profit */}
					<div className="rounded-lg border p-3 text-sm bg-gray-50">
						<div className="flex items-center justify-between mb-2">
							<span className="font-medium text-gray-700">Preview resulting profit</span>
							{calculatingProfit && <AiOutlineLoading className="animate-spin" />}
						</div>
						{profitPreview ? (
							<div className="grid grid-cols-2 gap-3">
								<div>
									<p className="text-gray-500">Current profit</p>
									<p className="font-semibold">{Number(profitPreview.current_profit).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Current commission</p>
									<p className="font-semibold">{Number(profitPreview.current_commission).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Adjustment</p>
									<p className="font-semibold">{Number(profitPreview.profit_adjustment).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Resulting profit</p>
									<p className="font-semibold text-primary">{Number(profitPreview.resulting_profit).toFixed(2)}</p>
								</div>
								<div className="col-span-2">
									<p className="text-gray-500">Resulting commission</p>
									<p className="font-semibold text-primary">{Number(profitPreview.resulting_commission).toFixed(2)}</p>
								</div>
								<div className="col-span-2 text-xs text-gray-600">
									{profitPreview.commission_will_increase && <p>Commission will increase by {Number(profitPreview.profit_difference).toFixed(2)}.</p>}
									{profitPreview.commission_will_decrease && <p>Commission will decrease by {Number(Math.abs(profitPreview.profit_difference)).toFixed(2)}.</p>}
								</div>
							</div>
						) : (
							<p className="text-xs text-gray-500">Type an amount to see the preview.</p>
						)}
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleCloseUpdateProfitModal}
						color="warning"
						variant="outlined"
						disabled={loadingSaveProfit}
					>
						Close
					</Button>
					<Button
						onClick={handleSaveProfit}
						color="primary"
						variant="contained"
						disabled={loadingSaveProfit}
					>
						{loadingSaveProfit && (
							<AiOutlineLoading className="animate-spin " />
						)}{" "}
						Save
					</Button>
				</DialogActions>
			</Dialog>

			{/* Update Today's Salary Modal */}
			<Dialog
				open={isUpdateSalaryModalOpen}
				onClose={handleCloseUpdateSalaryModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Update today's salary</DialogTitle>
				<DialogContent>
					<div className="grid grid-cols-1 gap-4">
						<TextField
							label="User"
							fullWidth
							disabled
							margin="dense"
							value={selectedRow?.username}
						/>

						<TextField
							label="Current Customer Today's salary"
							fullWidth
							type="number"
							value={selectedRow?.wallet?.salary}
							disabled
						/>

						<TextField
							label="Update Customer Today's salary"
							fullWidth
							type="number"
							value={customerSalary}
							onChange={(e) => setCustomerSalary(e.target.value)}
						/>
						<TextField
							label="Reason for change"
							fullWidth
							value={salaryChangeReason}
							onChange={(e) => setSalaryChangeReason(e.target.value)}
						/>
						<TextField
							label="Administrateur password"
							type="password"
							fullWidth
							value={adminPassword}
							onChange={(e) => setAdminPassword(e.target.value)}
						/>
					</div>
					{/* Real-time Preview Resulting Salary */}
					<div className="rounded-lg border p-3 text-sm bg-gray-50">
						<div className="flex items-center justify-between mb-2">
							<span className="font-medium text-gray-700">Preview resulting salary</span>
							{calculatingSalary && <AiOutlineLoading className="animate-spin" />}
						</div>
						{salaryPreview ? (
							<div className="grid grid-cols-2 gap-3">
								<div>
									<p className="text-gray-500">Current salary</p>
									<p className="font-semibold">{Number(salaryPreview.current_salary).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Current balance</p>
									<p className="font-semibold">{Number(salaryPreview.current_balance).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Adjustment</p>
									<p className="font-semibold">{Number(salaryPreview.salary_adjustment).toFixed(2)}</p>
								</div>
								<div>
									<p className="text-gray-500">Resulting salary</p>
									<p className="font-semibold text-primary">{Number(salaryPreview.resulting_salary).toFixed(2)}</p>
								</div>
								<div className="col-span-2">
									<p className="text-gray-500">Resulting balance</p>
									<p className="font-semibold text-primary">{Number(salaryPreview.resulting_balance).toFixed(2)}</p>
								</div>
								<div className="col-span-2 text-xs text-gray-600">
									{salaryPreview.balance_will_increase && <p>Balance will increase by {Number(salaryPreview.salary_difference).toFixed(2)}.</p>}
									{salaryPreview.balance_will_decrease && <p>Balance will decrease by {Number(Math.abs(salaryPreview.salary_difference)).toFixed(2)}.</p>}
								</div>
							</div>
						) : (
							<p className="text-xs text-gray-500">Type an amount to see the preview.</p>
						)}
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleCloseUpdateSalaryModal}
						disabled={loadingUpdateSalary}
						color="warning"
						variant="outlined"
					>
						Close
					</Button>
					<Button
						onClick={handleSaveSalary}
						disabled={loadingUpdateSalary}
						color="primary"
						variant="contained"
					>
						{loadingUpdateSalary && (
							<AiOutlineLoading className="animate-spin " />
						)}{" "}
						Save
					</Button>
				</DialogActions>
			</Dialog>

			{/* Update Today's Profit Modal */}
			<Dialog
				open={isUpdateCreditScoreModalOpen}
				onClose={handleCloseUpdateCreditScoreModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Update Credit Score</DialogTitle>
				<DialogContent>
					<div className="grid grid-cols-1 gap-4">
						<TextField
							label="User"
							fullWidth
							disabled
							margin="dense"
							value={selectedRow?.username}
						/>

						<TextField
							label="Customer Credit Score"
							fullWidth
							type="number"
							value={creditScore}
							onChange={(e) => setCreditScore(e.target.value)}
						/>
						<TextField
							label="Administrateur password"
							type="password"
							fullWidth
							value={adminPassword}
							onChange={(e) => setAdminPassword(e.target.value)}
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleCloseUpdateCreditScoreModal}
						color="warning"
						variant="outlined"
						disabled={loadingUpdateCreditScore}
					>
						Close
					</Button>
					<Button
						onClick={handleUpdateCreditScore}
						color="primary"
						variant="contained"
						disabled={loadingUpdateCreditScore}
					>
						{loadingUpdateCreditScore && (
							<AiOutlineLoading className="animate-spin " />
						)}{" "}
						Save
					</Button>
				</DialogActions>
			</Dialog>

			{/* Reset Customer Account Modal */}
			<Dialog
				open={isResetAccountModalOpen}
				onClose={handleCloseResetAccountModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Reset customer account</DialogTitle>
				<DialogContent>
					<div className="grid grid-cols-1 gap-4">
						<TextField
							label="User"
							fullWidth
							disabled
							margin="dense"
							value={selectedRow?.username}
						/>

						{/* Current Package Info */}
						<div className="bg-gray-50 p-3 rounded-lg">
							<p className="text-sm font-medium text-gray-700 mb-2">Current Package Limits:</p>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-gray-600">Daily Missions:</span>
									<span className="ml-2 font-semibold">
										{selectedRow?.daily_missions || selectedRow?.wallet?.package?.daily_missions || "N/A"}
									</span>
								</div>
								<div>
									<span className="text-gray-600">Number of Sets:</span>
									<span className="ml-2 font-semibold">
										{selectedRow?.number_of_set || selectedRow?.wallet?.package?.number_of_set || "N/A"}
									</span>
								</div>
							</div>
						</div>

						{/* Current Values */}
						<div className="bg-blue-50 p-3 rounded-lg">
							<p className="text-sm font-medium text-gray-700 mb-2">Current Values:</p>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-gray-600">Today's Submissions:</span>
									<span className="ml-2 font-semibold">
										{selectedRow?.number_of_submission_today || 0}
									</span>
								</div>
								<div>
									<span className="text-gray-600">Sets Completed:</span>
									<span className="ml-2 font-semibold">
										{selectedRow?.number_of_submission_set_today || 0}
									</span>
								</div>
							</div>
						</div>

						{/* Optional Reset Fields */}
						<div className="space-y-4">
							<p className="text-sm font-medium text-gray-700">Optional: Set specific values (leave empty for default reset)</p>
							
							<TextField
								label="Submission Count (Optional - 0 to package daily_missions)"
								type="number"
								fullWidth
								value={submissionCount}
								onChange={(e) => {
									setSubmissionCount(e.target.value);
									validateSubmissionCount(e.target.value);
								}}
								onBlur={(e) => validateSubmissionCount(e.target.value)}
								inputProps={{ 
									min: 0, 
									max: selectedRow?.daily_missions || selectedRow?.wallet?.package?.daily_missions || 999 
								}}
								error={!!submissionCountError}
								helperText={submissionCountError || `Max: ${selectedRow?.daily_missions || selectedRow?.wallet?.package?.daily_missions || "N/A"}`}
								sx={{
									'& .MuiOutlinedInput-root': {
										'&.Mui-error': {
											'& fieldset': {
												borderColor: '#d32f2f',
											},
										},
									},
								}}
							/>

							<TextField
								label="Set Count (Optional - 0 to package number_of_set)"
								type="number"
								fullWidth
								value={setCount}
								onChange={(e) => {
									setSetCount(e.target.value);
									validateSetCount(e.target.value);
								}}
								onBlur={(e) => validateSetCount(e.target.value)}
								inputProps={{ 
									min: 0, 
									max: selectedRow?.number_of_set || selectedRow?.wallet?.package?.number_of_set || 999 
								}}
								error={!!setCountError}
								helperText={setCountError || `Max: ${selectedRow?.number_of_set || selectedRow?.wallet?.package?.number_of_set || "N/A"}`}
								sx={{
									'& .MuiOutlinedInput-root': {
										'&.Mui-error': {
											'& fieldset': {
												borderColor: '#d32f2f',
											},
										},
									},
								}}
							/>
						</div>

						<TextField
							label="Administrateur password"
							type="password"
							fullWidth
							value={resetAdminPassword}
							onChange={(e) => setResetAdminPassword(e.target.value)}
							required
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleCloseResetAccountModal}
						color="warning"
						variant="outlined"
						disabled={loadingResetAccount}
					>
						Close
					</Button>
					<Button
						onClick={handleSaveResetAccount}
						color="primary"
						variant="contained"
						disabled={loadingResetAccount || !isFormValid}
					>
						{loadingResetAccount && (
							<AiOutlineLoading className="animate-spin " />
						)}{" "}
						Reset Account
					</Button>
				</DialogActions>
			</Dialog>

			{/* User Information Modal */}
			<Dialog
				open={isUserInfoModalOpen}
				onClose={handleCloseUserInfoModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>User Information</DialogTitle>
				<DialogContent>
					{loadingSeeMoreInfo ? (
						<Loading className="my-14" />
					) : (
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p>
									<strong>Username:</strong>{" "}
									{userInfo.username || "N/A"}
								</p>

								<Button
									color="primary"
									style={{ textTransform: "none" }}
									onClick={() =>
										navigator.clipboard.writeText(
											userInfo.username || "N/A",
										)
									}
								>
									Copy text
								</Button>
							</div>
							<div>
								<p>
									<strong>Full name:</strong>{" "}
									{`${userInfo?.first_name} ${userInfo?.last_name}` ||
										"N/A"}
								</p>

								<Button
									color="primary"
									style={{ textTransform: "none" }}
									onClick={() =>
										navigator.clipboard.writeText(
											`${userInfo?.first_name} ${userInfo?.last_name}` ||
											"N/A",
										)
									}
								>
									Copy text
								</Button>
							</div>

							<div>
								<p>
									<strong>TRC address:</strong>{" "}
									{userInfo?.use_payment_method?.wallet || "N/A"}
								</p>
								<Button
									color="primary"
									style={{ textTransform: "none" }}
									onClick={() =>
										navigator.clipboard.writeText(
											userInfo?.use_payment_method?.wallet || "N/A",
										)
									}
								>
									Copy text
								</Button>
							</div>
							<div>
								<p>
									<strong>TRC phone:</strong>{" "}
									{userInfo.phone_number || "N/A"}
								</p>
								<Button
									color="primary"
									style={{ textTransform: "none" }}
									onClick={() =>
										navigator.clipboard.writeText(
											userInfo.phone_number || "N/A",
										)
									}
								>
									Copy text
								</Button>
							</div>
							<div>
								<p>
									<strong>Exchange:</strong>{" "}
									{userInfo?.use_payment_method?.exchange || "N/A"}
								</p>
								<Button
									color="primary"
									style={{ textTransform: "none" }}
									onClick={() =>
										navigator.clipboard.writeText(
											userInfo.exchange || "N/A",
										)
									}
								>
									Copy text
								</Button>
							</div>
							<div>
								<p>
									<strong>Email address:</strong>{" "}
									{userInfo.email || "N/A"}
								</p>
								<Button
									color="primary"
									style={{ textTransform: "none" }}
									onClick={() =>
										navigator.clipboard.writeText(
											userInfo.email || "N/A",
										)
									}
								>
									Copy text
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleCloseUserInfoModal}
						color="warning"
						variant="outlined"
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			{/* Remove Customer's Registration Bonus Modal */}
			<Dialog
				open={isRemoveBonusModalOpen}
				onClose={handleCloseRemoveBonusModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>
					{selectedRow?.is_reg_balance_add ? "Remove" : "Add"} Customers
					Registration Bonus
				</DialogTitle>

				<DialogContent>
					<TextField
						label="User"
						fullWidth
						disabled
						margin="dense"
						value={selectedRow?.username}
					/>

					<TextField
						label="Administrateur Password"
						fullWidth
						margin="normal"
						type="password"
						variant="outlined"
						onChange={(e) => setAdminPassword(e.target.value)}
					/>
				</DialogContent>

				<DialogActions>
					<Button
						onClick={handleCloseRemoveBonusModal}
						disabled={loadingToggleRegBonus}
						variant="outlined"
						color="warning"
					>
						Close
					</Button>

					<Button
						onClick={handleRemoveRegistrationBonus}
						disabled={loadingToggleRegBonus}
						variant="contained"
						color="primary"
					>
						{loadingToggleRegBonus && (
							<AiOutlineLoading className="animate-spin" />
						)}{" "}
						Save
					</Button>
				</DialogActions>
			</Dialog>

			{/* Deactivate Minimum Balance Modal */}
			<Dialog
				open={isDeactivateBalanceModalOpen}
				onClose={handleCloseDeactivateBalanceModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>
					<span style={{ color: "#1A73E8", fontWeight: "bold" }}>
						Musosoup
					</span>
				</DialogTitle>
				<DialogContent>
					<p>
						Do you confirm the{" "}
						{selectedRow?.is_min_balance_for_submission_removed
							? "activation"
							: "deactivation"}{" "}
						of the minimum balance for submissions?
					</p>
				</DialogContent>

				<DialogActions>
					<Button
						onClick={handleCloseDeactivateBalanceModal}
						variant="contained"
						color="error"
						disabled={loadingToggleMinBalance}
					>
						Cancel
					</Button>

					<Button
						onClick={handleToggleMinBalance}
						variant="contained"
						color="primary"
						disabled={loadingToggleMinBalance}
					>
						{loadingToggleMinBalance && (
							<AiOutlineLoading className="animate-spin" />
						)}{" "}
						Confirm
					</Button>
				</DialogActions>
			</Dialog>

			{/* User Image */}
			<Dialog
				open={Boolean(selectedImage)}
				onClose={() => setSelectedImage(null)}
			>
				<DialogTitle>Screenshot Preview</DialogTitle>
				<DialogContent>
					<img
						src={selectedImage}
						alt="Screenshot Preview"
						className="w-full h-full"
					/>
				</DialogContent>
			</Dialog>

			{/* Update Package Modal */}
			<Dialog
				open={isUpdatePackageModalOpen}
				onClose={handleCloseUpdatePackageModal}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>
					<span style={{ color: "#1A73E8", fontWeight: "bold" }}>
						Update User Package
					</span>
				</DialogTitle>
				<DialogContent>
					<div className="space-y-4 mt-4">
						<TextField
							label="Username"
							fullWidth
							disabled
							value={selectedRow?.username}
						/>

						<TextField
							label="Current Package"
							fullWidth
							disabled
							value={selectedRow?.wallet?.package?.name || "No Package"}
						/>

						<FormControl fullWidth>
							<InputLabel>Select New Package</InputLabel>
							<Select
								value={selectedPackage}
								onChange={(e) => setSelectedPackage(e.target.value)}
								label="Select New Package"
							>
								{availablePacks.map((pack) => (
									<MenuItem key={pack.id} value={pack.id}>
										{pack.name} - ${pack.usd_value}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<TextField
							label="Admin Password"
							fullWidth
							margin="normal"
							type="password"
							variant="outlined"
							value={packageAdminPassword}
							onChange={(e) => setPackageAdminPassword(e.target.value)}
							placeholder="Enter admin transactional password"
						/>
					</div>
				</DialogContent>

				<DialogActions>
					<Button
						onClick={handleCloseUpdatePackageModal}
						variant="outlined"
						color="warning"
					>
						Close
					</Button>

					<Button
						onClick={handleUpdateUserPackage}
						disabled={loadingUpdatePackage}
						variant="contained"
						color="primary"
					>
						{loadingUpdatePackage && (
							<AiOutlineLoading className="animate-spin" />
						)}{" "}
						Update Package
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default AllUsers;

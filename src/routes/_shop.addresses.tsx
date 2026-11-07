import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { CheckCircle2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState, PageHeader } from "@/components/shared/Primitives";
import { useAuth } from "@/store/auth";
import {
  type SavedAddress,
  addSavedAddress,
  deleteSavedAddress,
  fetchSavedAddresses,
  setDefaultAddress,
  updateSavedAddress,
} from "@/lib/api";

export const Route = createFileRoute("/_shop/addresses")({
  head: () => ({
    meta: [
      { title: "Saved Addresses — PINDI CRUST" },
      {
        name: "description",
        content: "Manage your saved delivery addresses for faster checkout with PINDI CRUST.",
      },
      { property: "og:title", content: "Saved Addresses — PINDI CRUST" },
      {
        property: "og:description",
        content: "Add, edit or remove your PINDI CRUST delivery addresses.",
      },
    ],
  }),
  component: AddressesPage,
});

const schema = z.object({
  label: z.string().min(2, "Give this address a label"),
  line: z.string().min(8, "Enter a full address"),
});
type FormValues = z.infer<typeof schema>;

function AddressesPage() {
  const { role, isLoading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", line: "" },
  });

  const signedIn = role !== "guest";

  useEffect(() => {
    if (authLoading) return;
    if (!signedIn) {
      setLoading(false);
      return;
    }
    fetchSavedAddresses()
      .then(setAddresses)
      .catch(() => toast.error("Couldn't load your addresses"))
      .finally(() => setLoading(false));
  }, [authLoading, signedIn]);

  const openAdd = () => {
    setEditing(null);
    form.reset({ label: "", line: "" });
    setDialogOpen(true);
  };

  const openEdit = (address: SavedAddress) => {
    setEditing(address);
    form.reset({ label: address.label, line: address.line });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        await updateSavedAddress(editing.id, values);
        setAddresses((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...values } : a)));
        toast.success("Address updated");
      } else {
        const created = await addSavedAddress(values);
        setAddresses((prev) => [...prev, created]);
        toast.success("Address added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Something went wrong saving that address");
    }
  };

  const setDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      toast.success("Default address updated");
    } catch {
      toast.error("Couldn't set that as default");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteSavedAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address removed");
    } catch {
      toast.error("Couldn't remove that address");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="Saved Addresses"
        subtitle="Manage where we deliver your hearth-baked favourites."
        action={
          signedIn && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="sm" onClick={openAdd}>
                  <Plus className="size-4" /> Add Address
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Address" : "Add New Address"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label</FormLabel>
                          <FormControl>
                            <Input placeholder="Home, Office…" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="line"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full address</FormLabel>
                          <FormControl>
                            <Input placeholder="House #, Street, Sector, City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" variant="hero" className="w-full">
                        {editing ? "Save Changes" : "Add Address"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {!authLoading && !signedIn ? (
        <div className="mt-10">
          <EmptyState
            icon={<MapPin className="size-7" />}
            title="Sign in to manage addresses"
            description="Create an account or sign in to save delivery addresses for faster checkout."
          />
        </div>
      ) : loading ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : addresses.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<MapPin className="size-7" />}
            title="No saved addresses yet"
            description="Add a delivery address to speed up your next checkout."
            action={
              <Button variant="hero" onClick={openAdd}>
                <Plus className="size-4" /> Add Address
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft"
            >
              <div className="from-primary-soft flex h-24 items-center justify-center bg-linear-to-br to-surface-container text-primary/40">
                <MapPin className="size-9" strokeWidth={1.25} />
              </div>
              <div className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                      {a.label}
                      {a.isDefault && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                          <CheckCircle2 className="size-3" /> Default
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-pretty text-muted-foreground">{a.line}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!a.isDefault && (
                    <Button size="sm" variant="soft" onClick={() => setDefault(a.id)}>
                      <Star className="size-3.5" /> Set Default
                    </Button>
                  )}
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Edit ${a.label}`}
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon-sm" variant="outline" aria-label={`Delete ${a.label}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this address?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{a.label}" will be permanently removed from your saved addresses.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(a.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
